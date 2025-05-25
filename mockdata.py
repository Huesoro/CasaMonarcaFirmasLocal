# Este documento genera mock data para los usuarios, mandando a llamar a cada una de las funciones
# Tambien genera mock data para las donaciones, mandando a llamar a cada una de las funciones

import datetime
from Azure_SQL.conectBases import insert_user, insert_doc, insert_donacion_dinero, insert_donacion_insumos
import hashlib
from logica_python.CrearNuevoUser.crearUser import crear_usuario
from logica_python.crearDoc.flujo_crearDonacion import crear_donacion
import os

# Utilidad para hashear contraseñas

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Usuarios de prueba
usuarios = [
    {
        "email": "admin@casamonarca.org",
        "name": "Administrador",
        "password": "admin123",
        "role": "admin"
    },
    {
        "email": "finanzas@casamonarca.org",
        "name": "Finanzas",
        "password": "finanzas123",
        "role": "finance"
    },
    {
        "email": "recepcion@casamonarca.org",
        "name": "Recepción",
        "password": "recepcion123",
        "role": "reception"
    },
    {
        "email": "legal@casamonarca.org",
        "name": "Legal",
        "password": "legal123",
        "role": "legal"
    },
    {
        "email": "inventario@casamonarca.org",
        "name": "Inventario",
        "password": "inventario123",
        "role": "inventory"
    },
]

# Insertar usuarios usando el flujo real
for user in usuarios:
    crear_usuario(user["email"], user["name"], user["password"], user["role"], insert_user)

# Documentos de prueba
ahora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
documentos = [
    {
        "title": "Donación de Alimentos - Fundación Ayuda",
        "sharepoint_url": "SharePoint/Donaciones/doc_001.docx",
        "Type": "especie",
        "status": "pending",
        "user_id": 3,  # Recepción
        "created_at": ahora,
        "updated_at": ahora
    },
    {
        "title": "Donación Monetaria - Empresa XYZ",
        "sharepoint_url": "SharePoint/Donaciones/doc_002.docx",
        "Type": "dinero",
        "status": "signed",
        "user_id": 2,  # Finanzas
        "created_at": ahora,
        "updated_at": ahora
    },
    {
        "title": "Donación de Medicamentos - Farmacia ABC",
        "sharepoint_url": "SharePoint/Donaciones/doc_003.docx",
        "Type": "especie",
        "status": "pending",
        "user_id": 5,  # Inventario
        "created_at": ahora,
        "updated_at": ahora
    },
    {
        "title": "Donación Monetaria - Donante Anónimo",
        "sharepoint_url": "SharePoint/Donaciones/doc_004.docx",
        "Type": "dinero",
        "status": "rejected",
        "user_id": 2,  # Finanzas
        "created_at": ahora,
        "updated_at": ahora
    },
]

for doc in documentos:
    insert_doc(doc)

# Donaciones de dinero
for i, doc in enumerate(documentos):
    if doc["Type"] == "dinero":
        don_data = {
            "amount": 10000 + i * 500,
            "user_id": doc["user_id"],
            "created_at": ahora,
            "updated_at": ahora,
            "doc_id": i + 1
        }
        insert_donacion_dinero(don_data)

# Donaciones de insumos
for i, doc in enumerate(documentos):
    if doc["Type"] == "especie":
        insumo_data = {
            "amount": 50 + i * 10,
            "objeto": "Alimentos no perecederos, cobijas, kits de higiene" if i == 0 else "Medicamentos varios",
            "user_id": doc["user_id"],
            "created_at": ahora,
            "updated_at": ahora,
            "doc_id": i + 1
        }
        insert_donacion_insumos(insumo_data)

# Donaciones de prueba (dinero y especie)
# Simulamos que los user_id son 1,2,3,4,5 en el orden de arriba
user_ids = [1,2,3,4,5]

# Donación de especie
datos_especie = {
    "{fecha_donacion}": ahora,
    "{nombre_donante}": "Fundación Ayuda",
    "{lista_articulos}": "Alimentos no perecederos, cobijas, kits de higiene"
}
crear_donacion(datos_especie, user_ids[2])  # Recepción

# Donación de dinero
datos_dinero = {
    "{fecha_donacion}": ahora,
    "{nombre_donante}": "Empresa XYZ",
    "{monto_donado}": 10500
}
crear_donacion(datos_dinero, user_ids[1])  # Finanzas

# Otra donación de especie
datos_especie2 = {
    "{fecha_donacion}": ahora,
    "{nombre_donante}": "Farmacia ABC",
    "{lista_articulos}": "Medicamentos varios"
}
crear_donacion(datos_especie2, user_ids[4])  # Inventario

# Otra donación de dinero
datos_dinero2 = {
    "{fecha_donacion}": ahora,
    "{nombre_donante}": "Donante Anónimo",
    "{monto_donado}": 11000
}
crear_donacion(datos_dinero2, user_ids[1])  # Finanzas

# NUEVA MOCK DATA
usuarios_nuevos = [
    {"email": "sofia.garcia@casamonarca.org", "name": "Sofía García", "password": "sofia2024", "role": "admin"},
    {"email": "carlos.mendez@casamonarca.org", "name": "Carlos Méndez", "password": "carlos2024", "role": "finance"},
    {"email": "lucia.perez@casamonarca.org", "name": "Lucía Pérez", "password": "lucia2024", "role": "reception"},
    {"email": "juan.rios@casamonarca.org", "name": "Juan Ríos", "password": "juan2024", "role": "legal"},
    {"email": "mariana.lopez@casamonarca.org", "name": "Mariana López", "password": "mariana2024", "role": "inventory"},
]

mock_listado = []

for user in usuarios_nuevos:
    crear_usuario(user["email"], user["name"], user["password"], user["role"], insert_user)
    mock_listado.append(f"Usuario: {user['name']} ({user['email']}) - Rol: {user['role']}")

ahora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
user_ids_nuevos = [6,7,8,9,10]  # Asumiendo autoincremental después de los anteriores

donaciones_nuevas = [
    # Especie
    {"datos": {"{fecha_donacion}": ahora, "{nombre_donante}": "Grupo Voluntario Monterrey", "{lista_articulos}": "Ropa de abrigo, zapatos, mochilas"}, "user_id": user_ids_nuevos[2]},
    {"datos": {"{fecha_donacion}": ahora, "{nombre_donante}": "Farmacia San Pablo", "{lista_articulos}": "Medicamentos para gripe, termómetros"}, "user_id": user_ids_nuevos[4]},
    # Dinero
    {"datos": {"{fecha_donacion}": ahora, "{nombre_donante}": "Empresa ABC S.A.", "{monto_donado}": 25000}, "user_id": user_ids_nuevos[1]},
    {"datos": {"{fecha_donacion}": ahora, "{nombre_donante}": "Donador Privado", "{monto_donado}": 5000}, "user_id": user_ids_nuevos[1]},
]

for d in donaciones_nuevas:
    res = crear_donacion(d["datos"], d["user_id"])
    tipo = "dinero" if "{monto_donado}" in d["datos"] else "especie"
    mock_listado.append(f"Donación {tipo}: {d['datos']} (registrada por user_id {d['user_id']})")

# Guardar listado de mock data
with open("mockdata-listado.txt", "w", encoding="utf-8") as f:
    f.write("MOCK DATA GENERADA:\n\n")
    for item in mock_listado:
        f.write(item + "\n")

print("Mock data NUEVA insertada correctamente usando los flujos de negocio.")

