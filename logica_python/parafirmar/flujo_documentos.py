import sqlite3
import os
from docx import Document
from docx.shared import Inches
from logica_python.CrearCertificados.crearCertificado import crear_certificado_usuario
from pyhanko.sign import signers
from pyhanko.sign.fields import SigFieldSpec, append_signature_field
from pyhanko.sign.general import load_cert_from_pemder, load_private_key_from_pemder
from docx2pdf import convert
import tempfile
from Azure_SQL.conectBases import firmar_documento
import datetime
import shutil
import logging
from pyhanko_certvalidator.registry import SimpleCertificateStore
import concurrent.futures
import asyncio
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter

logging.basicConfig(level=logging.INFO, filename="debug_firmas.log")


PATH_FIRMADO_Finanzas = "SharePoint/Finanzas"
PATH_FIRMADO_Recepción = "SharePoint/Recepción"
PATH_FIRMADO_Inventario = "SharePoint/Inventario"
PATH_FIRMADO_Administrativo = "SharePoint/Administrativo"

# Buscar usuario por user_id en la base de datos

def buscar_usuario_por_id(user_id):
    conn = sqlite3.connect('Azure_SQL/Usuarios.db')
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, name, role, email FROM usuarios WHERE user_id = ?", (user_id,))
    resultado = cursor.fetchone()
    conn.close()
    if resultado:
        return {'user_id': resultado[0], 'name': resultado[1], 'role': resultado[2], 'email': resultado[3]}
    else:
        return None

# Buscar documento por id en la base de datos

def buscar_documento_por_id(doc_id):
    conn = sqlite3.connect('Azure_SQL/Documentos.db')
    cursor = conn.cursor()
    cursor.execute("SELECT doc_id, title, sharepoint_url FROM documentos WHERE doc_id = ?", (doc_id,))
    resultado = cursor.fetchone()
    conn.close()
    if resultado:
        return {'doc_id': resultado[0], 'title': resultado[1], 'sharepoint_url': resultado[2]}
    else:
        return None

# Buscar archivo físico en la carpeta SharePoint

def buscar_archivo_sharepoint(sharepoint_url):
    ruta = sharepoint_url
    if os.path.exists(ruta):
        return ruta
    else:
        raise FileNotFoundError(f"Archivo no encontrado en SharePoint: {ruta}")

def normalizar_correo(correo):
    return correo.strip().lower().replace("@", "_at_").replace(".", "_dot_")

def buscar_firma_por_correo(correo):
    archivo = normalizar_correo(correo) + ".png"
    ruta = os.path.join('SharePoint/firmas', archivo)
    if os.path.exists(ruta):
        return ruta
    else:
        raise FileNotFoundError(f"Firma no encontrada para {correo}")

def firmar_documento_word(ruta_docx, ruta_firma, nombre, rol):
    doc = Document(ruta_docx)
    firmado = False
    # Mapear rol a marcador y texto de rol
    rol_map = {
        "reception": {
            "marcador": "{nombre_receptor}",
            "texto_rol": "(Personal autorizado)"
        },
        "finance": {
            "marcador": "{nombre_finanzas}",
            "texto_rol": "(responsable de finanzas)"
        },
        "admin": {
            "marcador": "{nombre_dueno}",
            "texto_rol": "(Representante legal de Casa Monarca)"
        },
        "inventory": {
            "marcador": "{nombre_inventario}",
            "texto_rol": "(Responsable de inventarios)"
        }
    }
    if rol not in rol_map:
        print(f"Rol {rol} no reconocido para firma en Word.")
        return ruta_docx
    marcador = rol_map[rol]["marcador"]
    texto_rol = rol_map[rol]["texto_rol"]
    print(f"Buscando marcador: {marcador} para rol: {rol}")
    print(f"Tablas en el documento: {len(doc.tables)}")
    # Buscar en tablas
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for i, paragraph in enumerate(cell.paragraphs):
                    if marcador in paragraph.text:
                        print(f"Marcador encontrado en tabla: {paragraph.text}")
                        # Solo agregar la firma y la línea si no se ha firmado ya
                        if not firmado:
                            parrafo_firma = cell.paragraphs[i].insert_paragraph_before()
                            run = parrafo_firma.add_run()
                            run.add_picture(ruta_firma, width=Inches(2))
                            parrafo_linea = paragraph.insert_paragraph_before()
                            parrafo_linea.add_run("____________________")
                        # Reemplazar solo el marcador por el nombre
                        nuevo_texto = paragraph.text.replace(marcador, nombre)
                        paragraph.text = nuevo_texto
                        firmado = True
    if firmado:
        doc.save(ruta_docx)
        print(f"Documento firmado y guardado en: {ruta_docx}")
        logging.info("Documento firmado correctamente.")
    else:
        print("No se encontró el marcador para firmar en el documento.")
        logging.info("No se encontró el marcador para firmar en el documento.")
    return ruta_docx

def _firmar_pdf_sync(pdf_path, cert, key, output_path):
    signer = signers.SimpleSigner(
        signing_cert=cert,
        signing_key=key,
        cert_registry=None
    )
    print(f"Firmando PDF: {pdf_path} -> {output_path}")
    try:
        with open(pdf_path, 'rb') as inf, open(output_path, 'wb') as outf:
            signers.sign_pdf(
                inf,
                signers.PdfSignatureMetadata(field_name='FirmaDigital', reason='Firma digital Casa Monarca'),
                signer=signer,
                output=outf,
                existing_fields_only=False  # Forzar creación de campo de firma
            )
        print(f"PDF firmado correctamente: {output_path}")
        logging.info(f"PDF firmado correctamente: {output_path}")
    except Exception as e:
        print(f"Error al firmar PDF: {e}")
        logging.info(f"Error al firmar PDF: {e}")
        raise

async def firmar_digitalmente_pdf(pdf_path, cert_path, key_path, output_path, password):
    print("DEBUG cert_path:", cert_path, "type:", type(cert_path))
    print("DEBUG key_path:", key_path, "type:", type(key_path))
    print("DEBUG existe cert_path:", os.path.exists(cert_path))
    print("DEBUG existe key_path:", os.path.exists(key_path))
    cert = load_cert_from_pemder(cert_path)
    key = load_private_key_from_pemder(key_path, password.encode())
    loop = asyncio.get_event_loop()
    with concurrent.futures.ThreadPoolExecutor() as pool:
        await loop.run_in_executor(pool, _firmar_pdf_sync, pdf_path, cert, key, output_path)

def buscar_certificado_correo(correo):
    archivo = correo+"_cert.pem"
    ruta = os.path.join('certs', archivo)
    if os.path.exists(ruta):
        return ruta
    else:
        raise FileNotFoundError(f"Certificado no encontrado para {correo}")
def buscar_llave_correo(correo):
    archivo = correo+"_key.pem"
    ruta = os.path.join('certs', archivo)
    if os.path.exists(ruta):
        return ruta
    else:
        raise FileNotFoundError(f"Llave no encontrada para {correo}")

def agregar_campo_firma(pdf_path, output_path, nombre_campo='FirmaDigital'):
    with open(pdf_path, 'rb') as doc:
        writer = IncrementalPdfFileWriter(doc)
        sig_field_spec = SigFieldSpec(sig_field_name=nombre_campo)  # Invisible
        append_signature_field(writer, sig_field_spec)
        with open(output_path, 'wb') as out_doc:
            writer.write(out_doc)
    print(f"Campo de firma agregado: {output_path}")
    logging.info(f"Campo de firma agregado: {output_path}")

# Flujo principal actualizado

def flujo_documento(user_id, doc_id, password_firma, placeholder_nombre="{nombre_inventario}", rol=None):
    try:
        usuario = buscar_usuario_por_id(user_id)
        logging.info(f"Usuario encontrado: {usuario}")
        if not usuario:
            logging.info("Usuario no encontrado")
            return {"status": "error", "message": "Usuario no encontrado"}

        documento = buscar_documento_por_id(doc_id)
        logging.info(f"Documento encontrado: {documento}")
        if not documento:
            logging.info("Documento no encontrado")
            return {"status": "error", "message": "Documento no encontrado"}

        try:
            ruta_archivo_original = buscar_archivo_sharepoint(documento['sharepoint_url'])
            logging.info(f"Archivo encontrado: {ruta_archivo_original}")
        except FileNotFoundError as e:
            logging.info(f"Archivo no encontrado: {e}")
            return {"status": "error", "message": str(e)}

        if not os.path.isfile(ruta_archivo_original):
            logging.info(f"El archivo no existe o no es accesible: {ruta_archivo_original}")
            return {"status": "error", "message": f"El archivo no existe: {ruta_archivo_original}"}

        # Definir rutas finales para los archivos firmados
        carpeta_destino = os.path.dirname(ruta_archivo_original)
        nombre_archivo = os.path.basename(ruta_archivo_original)
        ruta_docx_firmado = os.path.join(carpeta_destino, nombre_archivo.replace('.docx', '_firmado.docx'))
        output_pdf = nombre_archivo.replace('.docx', '_firmado.pdf')
        ruta_pdf_firmado = os.path.join(carpeta_destino, output_pdf)
        ruta_pdf_con_campo = os.path.join(carpeta_destino, output_pdf.replace('.pdf', '_firmado_campo.pdf'))
        ruta_pdf_firmado_digital = os.path.join(carpeta_destino, output_pdf.replace('.pdf', '_firmado_digital.pdf'))

        # Copiar el archivo original a la ruta de firmado para no modificar el original
        shutil.copy2(ruta_archivo_original, ruta_docx_firmado)

        try:
            ruta_firma = buscar_firma_por_correo(usuario['email'])
        except FileNotFoundError as e:
            logging.info(f"Firma no encontrada: {e}")
            return {"status": "error", "message": str(e)}
        
        try:
            ruta_certificado = buscar_certificado_correo(usuario['email'])
        except FileNotFoundError as e:
            logging.info(f"Certificado no encontrado: {e}")
            return {"status": "error", "message": str(e)}

        try:
            ruta_llave = buscar_llave_correo(usuario['email'])
        except FileNotFoundError as e:
            logging.info(f"Llave no encontrada: {e}")
            return {"status": "error", "message": str(e)}

        print("CERTIFICADO:", ruta_certificado)
        print("LLAVE:", ruta_llave)
        print("EXISTE CERT:", os.path.exists(ruta_certificado))
        print("EXISTE KEY:", os.path.exists(ruta_llave))
         

        rol_firma = rol if rol else usuario['role'] if usuario['role'] else "Personal autorizado"
        firmar_documento_word(ruta_docx_firmado, ruta_firma, usuario['name'], rol_firma)

        # Convertir docx firmado a pdf firmado
        try:
            convert(ruta_docx_firmado, ruta_pdf_firmado)
            logging.info(f"Convertido a PDF: {ruta_pdf_firmado}")
        except Exception as e:
            logging.info(f"Error al convertir a PDF: {e}")
            return {"status": "error", "message": f"Error al convertir a PDF: {e}"}

        # Agregar campo de firma digital invisible
        try:
            agregar_campo_firma(ruta_pdf_firmado, ruta_pdf_con_campo, nombre_campo='FirmaDigital')
        except Exception as e:
            logging.info(f"Error al agregar campo de firma: {e}")
            return {"status": "error", "message": f"Error al agregar campo de firma: {e}"}

        logging.info(f"Firmando digitalmente PDF: {ruta_pdf_con_campo}")
        try:
            import nest_asyncio
            nest_asyncio.apply()
            asyncio.run(firmar_digitalmente_pdf(ruta_pdf_con_campo, ruta_certificado, ruta_llave, ruta_pdf_firmado_digital, password_firma))
            logging.info(f"PDF firmado digitalmente: {ruta_pdf_firmado_digital}")
        except Exception as e:
            logging.info(f"Error al firmar digitalmente: {e}")
            return {"status": "error", "message": f"Error al firmar digitalmente: {e}"}

        # Actualizar el flujo de firmas en la base de datos
        try:
            firmar_documento(doc_id, user_id, rol_firma)
            logging.info(f"Flujo de firmas actualizado para doc_id={doc_id}, user_id={user_id}, rol={rol_firma}")
        except Exception as e:
            logging.info(f"Error al actualizar flujo de firmas: {e}")
            return {"status": "error", "message": f"Error al actualizar flujo de firmas: {e}"}

        return {
            "status": "success",
            "message": "Documento PDF firmado digitalmente guardado y flujo actualizado.",
            "output_pdf": ruta_pdf_firmado_digital,
            "usuario": usuario,
            "documento": documento
        }
    except Exception as e:
        logging.info(f"ERROR FLUJO: {e}")
        return {"status": "error", "message": f"Error inesperado en el flujo: {e}"}
