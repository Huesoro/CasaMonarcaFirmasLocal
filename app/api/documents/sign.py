from fastapi import APIRouter, Request
from logica_python.parafirmar.flujo_documentos import flujo_documento

router = APIRouter()

@router.post("/documents/sign")
async def sign_document(request: Request):
    data = await request.json()
    correo = data["correo"]
    doc_id = data["doc_id"]
    password_firma = data["password_firma"]
    resultado = flujo_documento(correo, doc_id, password_firma)
    return resultado

