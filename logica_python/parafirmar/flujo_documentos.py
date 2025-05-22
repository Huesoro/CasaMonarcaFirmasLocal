import sqlite3
import os
from docx import Document
from docx.shared import Inches

# 1. Buscar usuario por correo en la base de datos

def buscar_usuario_por_correo(correo):
    conn = sqlite3.connect('../../Azure SQL/Usuarios.db')
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, name, role FROM usuarios WHERE email = ?", (correo,))
    resultado = cursor.fetchone()
    conn.close()
    if resultado:
        return {'user_id': resultado[0], 'name': resultado[1], 'role': resultado[2]}
    else:
        return None

# 2. Buscar documento por id en la base de datos

def buscar_documento_por_id(doc_id):
    conn = sqlite3.connect('../../Azure SQL/Documentos.db')
    cursor = conn.cursor()
    cursor.execute("SELECT doc_id, title, sharepoint_url FROM documentos WHERE doc_id = ?", (doc_id,))
    resultado = cursor.fetchone()
    conn.close()
    if resultado:
        return {'doc_id': resultado[0], 'title': resultado[1], 'sharepoint_url': resultado[2]}
    else:
        return None

# 3. Buscar archivo físico en la carpeta SharePoint

def buscar_archivo_sharepoint(sharepoint_url):
    ruta = os.path.join('../../SharePoint', sharepoint_url)
    if os.path.exists(ruta):
        return ruta
    else:
        raise FileNotFoundError(f"Archivo no encontrado en SharePoint: {ruta}")

def normalizar_correo(correo):
    return correo.strip().lower().replace("@", "_at_").replace(".", "_dot_")

def buscar_firma_por_correo(correo):
    archivo = normalizar_correo(correo) + ".png"
    ruta = os.path.join('../../SharePoint/firmas', archivo)
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

# 4. Flujo principal de ejemplo

def flujo_documento(correo, doc_id, placeholder_nombre="{nombre_inventario}", rol=None):
    usuario = buscar_usuario_por_correo(correo)
    if not usuario:
        print("Usuario no encontrado")
        return
    print("Usuario:", usuario)

    documento = buscar_documento_por_id(doc_id)
    if not documento:
        print("Documento no encontrado")
        return
    print("Documento:", documento)

    try:
        ruta_archivo = buscar_archivo_sharepoint(documento['sharepoint_url'])
        print("Ruta física del archivo:", ruta_archivo)
    except FileNotFoundError as e:
        print(e)
        return

    try:
        ruta_firma = buscar_firma_por_correo(correo)
        print("Ruta de la firma:", ruta_firma)
    except FileNotFoundError as e:
        print(e)
        return

    # Usar el rol del usuario si no se pasa explícitamente
    rol_firma = rol if rol else usuario['role'] if usuario['role'] else "Personal autorizado"
    # Firmar el documento Word
    firmar_documento_word(ruta_archivo, ruta_firma, usuario['name'], rol_firma, placeholder_nombre)

