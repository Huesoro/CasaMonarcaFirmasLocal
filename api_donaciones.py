from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from logica_python.crearDoc.flujo_crearDonacion import crear_donacion
from logica_python.CrearNuevoUser.crearUser import crear_usuario
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
from logica_python.parafirmar.flujo_documentos import flujo_documento
import datetime

app = FastAPI()

# Permitir peticiones desde localhost:3000 (Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    documentos = get_all_documents()
    donaciones_dinero = get_all_donaciones_dinero()
    donaciones_insumos = get_all_donaciones_insumos()
    
    # Obtener estados de firma
    conn_firmas = sqlite3.connect('Azure_SQL/firmas.db')
    cursor_firmas = conn_firmas.cursor()
    
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
    
    historial = []
    for doc in documentos:
        # Obtener el estado de firma actual
        cursor_firmas.execute("""
            SELECT status 
            FROM firmas_documento 
            WHERE doc_id = ? 
            ORDER BY orden DESC LIMIT 1
        """, (doc["doc_id"],))
        firma_status = cursor_firmas.fetchone()
        
        tipo = "money" if doc["Type"] == "dinero" else "supplies"
        donacion = dinero_por_doc.get(doc["doc_id"]) if tipo == "money" else insumos_por_doc.get(doc["doc_id"]) 
        
        historial.append({
            "id": f"don-{doc['doc_id']}",
            "title": doc["title"],
            "type": tipo,
            "date": doc["created_at"],
            "status": firma_status[0] if firma_status else "pendiente",  # Usar el estado real de firma
            "amount": donacion["amount"] if tipo == "money" and donacion else None,
            "items": donacion["objeto"] if tipo == "supplies" and donacion else None,
            "donor": usuarios.get(doc["user_id"], "Desconocido")
        })
    
    conn_firmas.close()
    return {"donaciones": historial}

@app.post("/api/documentos/firmar")
async def api_firmar_documento(request: Request):
    try:
        data = await request.json()
        doc_id = data.get("doc_id")
        user_id = data.get("user_id")
        rol = data.get("role")
        password_firma = data.get("password_firma")
        print("PASSWORD FIRMA:", password_firma)
        if not password_firma:
            return {"status": "error", "message": "Se requiere la contraseña de firma"}
        from logica_python.parafirmar.flujo_documentos import flujo_documento
        resultado = await flujo_documento(user_id, doc_id, password_firma, rol=rol)
        print("RESULTADO FLUJO:", resultado)
        return resultado
    except Exception as e:
        # Loguea el error en la raíz del proyecto
        with open('log_firmas.txt', 'a', encoding='utf-8') as f:
            f.write(f"[{datetime.datetime.now()}] ERROR API: {e}\n")
        return {"status": "error", "message": f"Error inesperado en el API: {e}"}

@app.get("/api/documentos/pendientes")
async def api_documentos_pendientes(user_id: int, rol: str):
    try:
        # Obtener los documentos pendientes
        docs = get_documentos_para_firmar(user_id, rol)
        
        # Si no hay documentos, retornar lista vacía
        if not docs:
            return {"documentos": []}
            
        # Obtener los nombres de los creadores
        conn_users = sqlite3.connect('Azure_SQL/Usuarios.db')
        cursor_users = conn_users.cursor()
        
        # Agregar el nombre del creador a cada documento
        for doc in docs:
            if doc.get("user_id"):
                cursor_users.execute("SELECT name FROM usuarios WHERE user_id = ?", (doc["user_id"],))
                user_row = cursor_users.fetchone()
                doc["creador_nombre"] = user_row[0] if user_row else "Desconocido"
            else:
                doc["creador_nombre"] = "Desconocido"
        
        conn_users.close()
        return {"documentos": docs}
        
    except Exception as e:
        print(f"Error en api_documentos_pendientes: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/api/documentos/firmas/{doc_id}")
async def api_firmas_documento(doc_id: str):
    conn = sqlite3.connect('Azure_SQL/Firmas.db')
    cursor = conn.cursor()
    query = """
        SELECT orden, rol, status, fecha_firma, user_id
        FROM firmas_documento
        WHERE doc_id = ?
        ORDER BY orden ASC
    """
    cursor.execute(query, (doc_id,))
    rows = cursor.fetchall()
    firmas = []
    # Abre la otra base para obtener los nombres de usuario
    conn_users = sqlite3.connect('Azure_SQL/Usuarios.db')
    cursor_users = conn_users.cursor()
    for row in rows:
        user_id = row[4]
        nombre = None
        if user_id:
            cursor_users.execute("SELECT name FROM usuarios WHERE user_id = ?", (user_id,))
            user_row = cursor_users.fetchone()
            nombre = user_row[0] if user_row else None
        firmas.append({
            "orden": row[0],
            "rol": row[1],
            "status": row[2],
            "fecha_firma": row[3],
            "nombre": nombre
        })
    conn.close()
    conn_users.close()
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
 