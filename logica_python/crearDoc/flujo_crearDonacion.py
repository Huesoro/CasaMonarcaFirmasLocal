import os
import uuid
from datetime import datetime
from Azure_SQL.conectBases import insert_doc, insert_donacion_dinero, insert_donacion_insumos, insertar_flujo_firmas
from docx import Document

DOCUMENTOS_PATH = "SharePoint/Donaciones/"
MACHOTES_PATH = "SharePoint/Machotes/"

def rellenar_campos_docx(path_machote, datos, id_documento):
    """
    Rellena los campos {campo} en un documento .docx y guarda usando un ID único.
    """
    doc = Document(path_machote)

    # Reemplazar en párrafos
    for p in doc.paragraphs:
        for key, value in datos.items():
            if key in p.text:
                p.text = p.text.replace(key, str(value))

    # Reemplazar en tablas
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for key, value in datos.items():
                    if key in cell.text:
                        cell.text = cell.text.replace(key, str(value))

    path_salida = os.path.join(DOCUMENTOS_PATH, f"doc_{id_documento}.docx")
    doc.save(path_salida)
    return path_salida

def crear_donacion(datos, user_id):
    """
    Crea el documento de donación, lo guarda y registra la donación en la base de datos.
    """
    # 1. Generar ID único
    id_documento = str(uuid.uuid4())
    now = datetime.now()
    fecha_hoy = now.strftime("%Y-%m-%d %H:%M:%S")

    # 2. Determinar tipo y machote
    if "{monto_donado}" in datos or "monto_donado" in datos:
        tipo_donacion = "dinero"
        path_machote = os.path.join(MACHOTES_PATH, "Donacion_Dinero.docx")
    elif "{lista_articulos}" in datos or "lista_articulos" in datos:
        tipo_donacion = "especie"
        path_machote = os.path.join(MACHOTES_PATH, "Donacion_Especie.docx")
    else:
        return {"status": "error", "message": "No se reconoce el tipo de donación."}

    # 3. Rellenar y guardar documento
    path_docx = rellenar_campos_docx(path_machote, datos, id_documento)

    # ✅ 4. Obtener nombre del donante
    nombre_donante = datos.get("{nombre_donante}") or datos.get("nombre_donante") or "Anónimo"

    # ✅ 5. Crear título amigable
    titulo = f"Donación {tipo_donacion} - {nombre_donante}"

    # 6. Registrar el documento
    doc_data = {
        "doc_id": id_documento,
        "title": titulo,
        "sharepoint_url": path_docx,
        "Type": tipo_donacion,
        "status": "pending",
        "user_id": user_id,
        "created_at": fecha_hoy,
        "updated_at": fecha_hoy
    }
    insert_doc(doc_data)

    # 7. Registrar el detalle de la donación
    if tipo_donacion == "dinero":
        don_data = {
            "amount": datos.get("monto_donado") or datos.get("{monto_donado}"),
            "user_id": user_id,
            "created_at": fecha_hoy,
            "updated_at": fecha_hoy,
            "doc_id": id_documento
        }
        insert_donacion_dinero(don_data)
    elif tipo_donacion == "especie":
        insumo_data = {
            "amount": datos.get("cantidad") or 1,
            "objeto": datos.get("lista_articulos") or datos.get("{lista_articulos}"),
            "user_id": user_id,
            "created_at": fecha_hoy,
            "updated_at": fecha_hoy,
            "doc_id": id_documento
        }
        insert_donacion_insumos(insumo_data)

    # 8. Insertar el flujo de firmas
    insertar_flujo_firmas(id_documento, user_id, tipo_donacion)

    return {
        "status": "success",
        "message": "Donación registrada correctamente.",
        "tipo_donacion": tipo_donacion,
        "id_documento": id_documento,
        "path_docx": path_docx
    }

