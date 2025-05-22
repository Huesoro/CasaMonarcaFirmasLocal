from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from logica_python.crearDoc.flujo_crearDonacion import crear_donacion

app = FastAPI()

# Permitir peticiones desde localhost:3000 (Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/crear-donacion")
async def api_crear_donacion(request: Request):
    data = await request.json()
    datos = data.get("datos")
    user_id = data.get("user_id")
    resultado = crear_donacion(datos, user_id)
    return resultado 