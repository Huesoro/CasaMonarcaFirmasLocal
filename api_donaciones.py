from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from logica_python.crearDoc.flujo_crearDonacion import crear_donacion
from logica_python.CrearNuevoUser.crearUser import crear_usuario
from app.api.documents.sign import router as sign_router
from app.api.documents.download import router as download_router
from app.api.documents.route import router as documents_router
import hashlib
import sqlite3
from Azure_SQL.conectBases import (
    get_all_documents, get_all_donaciones_dinero, get_all_donaciones_insumos,
    insertar_flujo_firmas, get_documentos_para_firmar, firmar_documento
)
import shutil
import os

app = FastAPI()

# Permitir peticiones desde localhost:3000 (Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sign_router, prefix="/api")
app.include_router(download_router, prefix="/api")
app.include_router(documents_router, prefix="/api")

@app.post("/api/crear-donacion")
async def api_crear_donacion(request: Request):
    data = await request.json()
    datos = data.get("datos")
    user_id = data.get("user_id")
    resultado = crear_donacion(datos, user_id)
    # Determinar tipo de donación
    if "{monto_donado}" in datos or "monto_donado" in datos:
        tipo_donacion = "dinero"
    elif "{lista_articulos}" in datos or "lista_articulos" in datos:
        tipo_donacion = "especie"
    else:
        tipo_donacion = "desconocido"
    # Insertar flujo de firmas si la donación fue creada correctamente
    if resultado.get("status") == "success":
        insertar_flujo_firmas(resultado["id_documento"], user_id, tipo_donacion)
    return resultado

@app.post("/api/crear-usuario")
async def api_crear_usuario(request: Request):
    data = await request.json()
    email = data.get("email")
    nombre = data.get("nombre")
    password = data.get("password")
    role = data.get("role")
    # Aquí deberías importar la función insert_user desde tu backend
    from Azure_SQL.conectBases import insert_user
    crear_usuario(email, nombre, password, role, insert_user)
    return {"status": "success", "message": "Usuario creado correctamente"}

@app.post("/api/login")
async def api_login(request: Request):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return {"status": "error", "message": "Email y contraseña requeridos"}
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    try:
        conn = sqlite3.connect('Azure_SQL/Usuarios.db')
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, name, email, role FROM usuarios WHERE email = ? AND hashed_password = ?", (email, hashed_password))
        row = cursor.fetchone()
        if row:
            user = {
                "user_id": row[0],
                "name": row[1],
                "email": row[2],
                "role": row[3]
            }
            return {"status": "success", "user": user}
        else:
            return {"status": "error", "message": "Credenciales incorrectas"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if conn:
            conn.close()

@app.get("/api/historial-donaciones")
async def api_historial_donaciones():
    # Obtener documentos
    documentos = get_all_documents()
    # Obtener donaciones de dinero e insumos
    donaciones_dinero = get_all_donaciones_dinero()
    donaciones_insumos = get_all_donaciones_insumos()
    # Crear índices para acceso rápido
    dinero_por_doc = {d["doc_id"]: d for d in donaciones_dinero}
    insumos_por_doc = {d["doc_id"]: d for d in donaciones_insumos}
    # Obtener usuarios para mapear user_id a nombre
    usuarios = {}
    try:
        conn = sqlite3.connect('Azure_SQL/Usuarios.db')
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, name FROM usuarios")
        for row in cursor.fetchall():
            usuarios[row[0]] = row[1]
    except Exception as e:
        pass
    finally:
        if 'conn' in locals():
            conn.close()
    # Construir historial
    historial = []
    for doc in documentos:
        tipo = "money" if doc["Type"] == "dinero" else "supplies"
        donacion = dinero_por_doc.get(doc["doc_id"]) if tipo == "money" else insumos_por_doc.get(doc["doc_id"]) 
        historial.append({
            "id": f"don-{doc['doc_id']}",
            "title": doc["title"],
            "type": tipo,
            "date": doc["created_at"],
            "status": "completed" if doc["status"] == "signed" else doc["status"],
            "amount": donacion["amount"] if tipo == "money" and donacion else None,
            "items": donacion["objeto"] if tipo == "supplies" and donacion else None,
            "donor": usuarios.get(doc["user_id"], "Desconocido")
        })
    return {"donaciones": historial}

@app.post("/api/documentos/firmar")
async def api_firmar_documento(request: Request):
    data = await request.json()
    doc_id = data.get("doc_id")
    user_id = data.get("user_id")
    rol = data.get("role")
    firmar_documento(doc_id, user_id, rol)
    return {"status": "success", "message": "Documento firmado"}

@app.get("/api/documentos/pendientes")
async def api_documentos_pendientes(user_id: int, rol: str):
    doc_ids = get_documentos_para_firmar(user_id, rol)
    if not doc_ids:
        return {"documentos": []}
    placeholders = ','.join(['?'] * len(doc_ids))
    conn = sqlite3.connect('Azure_SQL/Documentos.db')
    cursor = conn.cursor()
    query = f"""
        SELECT d.doc_id, d.title, d.sharepoint_url, d.Type, d.status, d.user_id, d.created_at, d.updated_at
        FROM documentos d
        WHERE d.doc_id IN ({placeholders})
    """
    cursor.execute(query, doc_ids)
    rows = cursor.fetchall()
    documentos = []
    # Abre la otra base para obtener los nombres de usuario
    conn_users = sqlite3.connect('Azure_SQL/Usuarios.db')
    cursor_users = conn_users.cursor()
    for row in rows:
        user_id = row[5]
        cursor_users.execute("SELECT name FROM usuarios WHERE user_id = ?", (user_id,))
        user_row = cursor_users.fetchone()
        creador_nombre = user_row[0] if user_row else "Desconocido"
        documentos.append({
            "doc_id": row[0],
            "title": row[1],
            "sharepoint_url": row[2],
            "Type": row[3],
            "status": row[4],
            "user_id": row[5],
            "created_at": row[6],
            "updated_at": row[7],
            "creador_nombre": creador_nombre
        })
    conn.close()
    conn_users.close()
    return {"documentos": documentos}

@app.get("/api/documentos/firmas/{doc_id}")
async def api_firmas_documento(doc_id: int):
    conn = sqlite3.connect('Azure_SQL/Firmas.db')
    cursor = conn.cursor()
    query = """
        SELECT f.orden, f.rol, f.status, f.fecha_firma, u.name
        FROM firmas_documento f
        LEFT JOIN ../Usuarios.db.u u ON f.user_id = u.user_id
        WHERE f.doc_id = ?
        ORDER BY f.orden ASC
    """
    cursor.execute(query, (doc_id,))
    rows = cursor.fetchall()
    firmas = []
    for row in rows:
        firmas.append({
            "orden": row[0],
            "rol": row[1],
            "status": row[2],
            "fecha_firma": row[3],
            "nombre": row[4]
        })
    conn.close()
    return {"firmas": firmas}

@app.post("/api/upload-firma")
async def upload_firma(firma: UploadFile = File(...), email: str = Form(...)):
    # Normalizar el nombre del archivo
    def normalizar_correo(correo):
        return correo.strip().lower().replace("@", "_at_").replace(".", "_dot_")
    nombre_archivo = normalizar_correo(email) + os.path.splitext(firma.filename)[-1]
    ruta_carpeta = os.path.join("SharePoint", "firmas")
    os.makedirs(ruta_carpeta, exist_ok=True)
    ruta_destino = os.path.join(ruta_carpeta, nombre_archivo)
    try:
        with open(ruta_destino, "wb") as buffer:
            shutil.copyfileobj(firma.file, buffer)
        return {"status": "success", "filename": nombre_archivo}
    except Exception as e:
        return {"status": "error", "message": str(e)}
