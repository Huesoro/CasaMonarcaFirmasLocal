from fastapi import APIRouter
from fastapi.responses import JSONResponse
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))
from Azure_SQL.conectBases import get_all_documents

router = APIRouter()

@router.get("/documents")
def get_documents():
    documentos = get_all_documents()
    return JSONResponse(content=documentos) 