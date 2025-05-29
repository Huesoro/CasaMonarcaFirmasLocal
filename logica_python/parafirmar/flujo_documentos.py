import sqlite3
import os
from docx import Document
from docx.shared import Inches
from logica_python.CrearCertificados.crearCertificado import crear_certificado_usuario
from pyhanko.sign import signers
from pyhanko.sign.fields import SigFieldSpec
from pyhanko.sign.general import load_cert_from_pemder, load_private_key_from_pemder
from docx2pdf import convert
import tempfile
from Azure_SQL.conectBases import firmar_documento
import datetime
import shutil

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
    ruta = os.path.join('SharePoint', sharepoint_url)
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

def firmar_documento_word(ruta_docx, ruta_firma, nombre, rol, placeholder_nombre):
    doc = Document(ruta_docx)
    firmado = False
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for i, paragraph in enumerate(cell.paragraphs):
                    if placeholder_nombre in paragraph.text:
                        parrafo_firma = cell.paragraphs[i].insert_paragraph_before()
                        run = parrafo_firma.add_run()
                        run.add_picture(ruta_firma, width=Inches(2))
                        parrafo_linea = paragraph.insert_paragraph_before()
                        parrafo_linea.add_run("____________________")
                        paragraph.text = f"{rol}: {nombre}\n(Personal autorizado)"
                        firmado = True
    if firmado:
        doc.save(ruta_docx)
        print("Documento firmado correctamente.")
    else:
        print("No se encontró el marcador para firmar en el documento.")
    return ruta_docx

def firmar_digitalmente_pdf(pdf_path, cert_path, key_path, output_path, password):
    with open(cert_path, 'rb') as f:
        cert = load_cert_from_pemder(f.read())
    with open(key_path, 'rb') as f:
        key = load_private_key_from_pemder(f.read(), password.encode())
    signer = signers.SimpleSigner(
        signing_cert=cert,
        signing_key=key,
        cert_registry=signers.SimpleCertificateStore()
    )
    with open(pdf_path, 'rb') as inf, open(output_path, 'wb') as outf:
        signers.sign_pdf(
            inf,
            signers.PdfSignatureMetadata(field_name='FirmaDigital'),
            signer=signer,
            output=outf
        )
        
def buscar_certificado_correo(correo):
    archivo = correo+"_cert.pem"
    ruta = os.path.join('SharePoint/certificados', archivo)
    if os.path.exists(ruta):
        return ruta
    else:
        raise FileNotFoundError(f"Certificado no encontrado para {correo}")
def buscar_llave_correo(correo):
    archivo = correo+"_key.pem"
    ruta = os.path.join('SharePoint/certificados', archivo)
    if os.path.exists(ruta):
        return ruta
    else:
        raise FileNotFoundError(f"Llave no encontrada para {correo}")

def log_firma(msg):
    ruta_log = 'log_firmas.txt'
    os.makedirs(os.path.dirname(ruta_log) or '.', exist_ok=True)
    try:
        with open(ruta_log, 'a', encoding='utf-8') as f:
            f.write(f"[{datetime.datetime.now()}] {msg}\n")
    except Exception as e:
        pass  # No detengas el flujo si el log falla

# Flujo principal actualizado

def flujo_documento(user_id, doc_id, password_firma, placeholder_nombre="{nombre_inventario}", rol=None):
    try:
        usuario = buscar_usuario_por_id(user_id)
        if not usuario:
            log_firma("Usuario no encontrado")
            return {"status": "error", "message": "Usuario no encontrado"}

        documento = buscar_documento_por_id(doc_id)
        if not documento:
            log_firma("Documento no encontrado")
            return {"status": "error", "message": "Documento no encontrado"}

        try:
            ruta_archivo_original = buscar_archivo_sharepoint(documento['sharepoint_url'])
        except FileNotFoundError as e:
            log_firma(f"Archivo no encontrado: {e}")
            return {"status": "error", "message": str(e)}

        if not os.path.isfile(ruta_archivo_original):
            log_firma(f"El archivo no existe o no es accesible: {ruta_archivo_original}")
            return {"status": "error", "message": f"El archivo no existe: {ruta_archivo_original}"}

        # Copia el archivo a una carpeta temporal para modificarlo
        with tempfile.TemporaryDirectory() as tmpdir:
            ruta_archivo = os.path.join(tmpdir, os.path.basename(ruta_archivo_original))
            shutil.copy2(ruta_archivo_original, ruta_archivo)

            try:
                ruta_firma = buscar_firma_por_correo(usuario['email'])
            except FileNotFoundError as e:
                log_firma(f"Firma no encontrada: {e}")
                return {"status": "error", "message": str(e)}
            
            try:
                ruta_certificado = buscar_certificado_correo(usuario['email'])
            except FileNotFoundError as e:
                log_firma(f"Certificado no encontrado: {e}")
                return {"status": "error", "message": str(e)}

            try:
                ruta_llave = buscar_llave_correo(usuario['email'])
            except FileNotFoundError as e:
                log_firma(f"Llave no encontrada: {e}")
                return {"status": "error", "message": str(e)}

            rol_firma = rol if rol else usuario['role'] if usuario['role'] else "Personal autorizado"
            ruta_docx_firmado = firmar_documento_word(ruta_archivo, ruta_firma, usuario['name'], rol_firma, placeholder_nombre)

            # Guardar el PDF firmado en la misma carpeta temporal
            carpeta_destino = tmpdir
            nombre_archivo = os.path.basename(ruta_docx_firmado)
            output_pdf = nombre_archivo.replace('.docx', '_firmado.pdf')
            ruta_pdf_firmado = os.path.join(carpeta_destino, output_pdf)

            # Convertir docx a pdf
            try:
                convert(ruta_docx_firmado, ruta_pdf_firmado)
                log_firma(f"Convertido a PDF: {ruta_pdf_firmado}")
            except Exception as e:
                log_firma(f"Error al convertir a PDF: {e}")
                return {"status": "error", "message": f"Error al convertir a PDF: {e}"}

            log_firma(f"Firmando digitalmente PDF: {ruta_pdf_firmado}")
            try:
                firmar_digitalmente_pdf(ruta_pdf_firmado, ruta_certificado, ruta_llave, ruta_pdf_firmado, password_firma)
                log_firma(f"PDF firmado digitalmente: {ruta_pdf_firmado}")
            except Exception as e:
                log_firma(f"Error al firmar digitalmente: {e}")
                return {"status": "error", "message": f"Error al firmar digitalmente: {e}"}
            
            # Copia el PDF firmado de vuelta a la carpeta original (junto al Word)
            destino_final = os.path.join(os.path.dirname(ruta_archivo_original), output_pdf)
            shutil.copy2(ruta_pdf_firmado, destino_final)
            log_firma(f"PDF firmado copiado a: {destino_final}")

        # Actualizar el flujo de firmas en la base de datos
        try:
            firmar_documento(doc_id, user_id, rol_firma)
            log_firma(f"Flujo de firmas actualizado para doc_id={doc_id}, user_id={user_id}, rol={rol_firma}")
        except Exception as e:
            log_firma(f"Error al actualizar flujo de firmas: {e}")
            return {"status": "error", "message": f"Error al actualizar flujo de firmas: {e}"}

        return {
            "status": "success",
            "message": "Documento PDF firmado digitalmente guardado y flujo actualizado.",
            "output_pdf": destino_final,
            "usuario": usuario,
            "documento": documento
        }
    except Exception as e:
        log_firma(f"ERROR FLUJO: {e}")
        return {"status": "error", "message": f"Error inesperado en el flujo: {e}"}
