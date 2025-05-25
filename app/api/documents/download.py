from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
from Azure_SQL.conectBases import get_all_documents

router = APIRouter()

@router.get("/documents/download/{doc_id}")
def download_document(doc_id: int):
    # Busca el documento por id
    documentos = get_all_documents()
    doc = next((d for d in documentos if d["doc_id"] == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    file_path = doc["sharepoint_url"]
    # Si la ruta es relativa, ajústala
    if not os.path.isabs(file_path):
        file_path = os.path.join(os.getcwd(), file_path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado en el servidor")
    # Devuelve el archivo
    return FileResponse(path=file_path, filename=os.path.basename(file_path), media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
