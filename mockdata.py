# Este documento genera mock data para los usuarios, mandando a llamar a cada una de las funciones
# Tambien genera mock data para las donaciones, mandando a llamar a cada una de las funciones

import datetime
from Azure_SQL.conectBases import insert_user, firmar_documento
from logica_python.CrearNuevoUser.crearUser import crear_usuario
from logica_python.crearDoc.flujo_crearDonacion import crear_donacion
import hashlib
import os

# Utilidad para hashear contraseñas

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Usuarios de prueba
usuarios = [
    {"email": "admin@casamonarca.org", "name": "Administrador", "password": "admin123", "role": "admin"},
    {"email": "finanzas@casamonarca.org", "name": "Finanzas", "password": "finanzas123", "role": "finance"},
    {"email": "recepcion@casamonarca.org", "name": "Recepción", "password": "recepcion123", "role": "reception"},
    {"email": "legal@casamonarca.org", "name": "Legal", "password": "legal123", "role": "legal"},
    {"email": "inventario@casamonarca.org", "name": "Inventario", "password": "inventario123", "role": "inventory"},
]

# Insertar usuarios usando el flujo real
for user in usuarios:
    crear_usuario(user["email"], user["name"], user["password"], user["role"], insert_user)

# IDs de usuarios según el orden de inserción
user_ids = [1,2,3,4,5]

ahora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

mock_listado = []

# --- Donaciones de prueba usando crear_donacion y simulando firmas ---
# 1. Donación de especie (pendiente)
datos_especie = {
    "{fecha_donacion}": ahora,
    "{nombre_donante}": "Fundación Ayuda",
    "{lista_articulos}": "Alimentos no perecederos, cobijas, kits de higiene"
}
res1 = crear_donacion(datos_especie, user_ids[2])  # Recepción
mock_listado.append(f"Donación especie pendiente: {datos_especie} (doc_id {res1['id_documento']})")

# 2. Donación de dinero (firmada)
datos_dinero = {
    "{fecha_donacion}": ahora,
    "{nombre_donante}": "Empresa XYZ",
    "{monto_donado}": 10500
}
res2 = crear_donacion(datos_dinero, user_ids[1])  # Finanzas
# Simula firmas para avanzar el flujo (finanzas y admin)
firmar_documento(res2["id_documento"], user_ids[1], "finance")  # Firma finanzas
firmar_documento(res2["id_documento"], None, "admin")           # Firma admin
mock_listado.append(f"Donación dinero firmada: {datos_dinero} (doc_id {res2['id_documento']})")

# 3. Donación de especie (firmada solo por inventario)
datos_especie2 = {
    "{fecha_donacion}": ahora,
    "{nombre_donante}": "Farmacia ABC",
    "{lista_articulos}": "Medicamentos varios"
}
res3 = crear_donacion(datos_especie2, user_ids[4])  # Inventario
firmar_documento(res3["id_documento"], user_ids[4], "inventory")  # Firma inventario
mock_listado.append(f"Donación especie firmada solo por inventario: {datos_especie2} (doc_id {res3['id_documento']})")

# 4. Donación de dinero (pendiente)
datos_dinero2 = {
    "{fecha_donacion}": ahora,
    "{nombre_donante}": "Donante Anónimo",
    "{monto_donado}": 11000
}
res4 = crear_donacion(datos_dinero2, user_ids[1])  # Finanzas
mock_listado.append(f"Donación dinero pendiente: {datos_dinero2} (doc_id {res4['id_documento']})")

# --- Usuarios y donaciones adicionales (mock nuevos) ---
usuarios_nuevos = [
    {"email": "sofia.garcia@casamonarca.org", "name": "Sofía García", "password": "sofia2024", "role": "admin"},
    {"email": "carlos.mendez@casamonarca.org", "name": "Carlos Méndez", "password": "carlos2024", "role": "finance"},
    {"email": "lucia.perez@casamonarca.org", "name": "Lucía Pérez", "password": "lucia2024", "role": "reception"},
    {"email": "juan.rios@casamonarca.org", "name": "Juan Ríos", "password": "juan2024", "role": "legal"},
    {"email": "mariana.lopez@casamonarca.org", "name": "Mariana López", "password": "mariana2024", "role": "inventory"},
]
user_ids_nuevos = [6,7,8,9,10]  # Asumiendo autoincremental después de los anteriores
for user in usuarios_nuevos:
    crear_usuario(user["email"], user["name"], user["password"], user["role"], insert_user)
    mock_listado.append(f"Usuario: {user['name']} ({user['email']}) - Rol: {user['role']}")

# Donaciones nuevas usando el flujo real
donaciones_nuevas = [
    # Especie (pendiente)
    {"datos": {"{fecha_donacion}": ahora, "{nombre_donante}": "Grupo Voluntario Monterrey", "{lista_articulos}": "Ropa de abrigo, zapatos, mochilas"}, "user_id": user_ids_nuevos[2]},
    # Especie (firmada)
    {"datos": {"{fecha_donacion}": ahora, "{nombre_donante}": "Farmacia San Pablo", "{lista_articulos}": "Medicamentos para gripe, termómetros"}, "user_id": user_ids_nuevos[4]},
    # Dinero (firmada)
    {"datos": {"{fecha_donacion}": ahora, "{nombre_donante}": "Empresa ABC S.A.", "{monto_donado}": 25000}, "user_id": user_ids_nuevos[1]},
    # Dinero (pendiente)
    {"datos": {"{fecha_donacion}": ahora, "{nombre_donante}": "Donador Privado", "{monto_donado}": 5000}, "user_id": user_ids_nuevos[1]},
]

for i, d in enumerate(donaciones_nuevas):
    res = crear_donacion(d["datos"], d["user_id"])
    tipo = "dinero" if "{monto_donado}" in d["datos"] else "especie"
    # Simula firmas para algunos documentos
    if i == 1:  # Especie firmada
        firmar_documento(res["id_documento"], d["user_id"], "inventory")
        firmar_documento(res["id_documento"], None, "admin")
    if i == 2:  # Dinero firmada
        firmar_documento(res["id_documento"], d["user_id"], "finance")
        firmar_documento(res["id_documento"], None, "admin")
    mock_listado.append(f"Donación {tipo}: {d['datos']} (doc_id {res['id_documento']})")

# Guardar listado de mock data
with open("mockdata-listado.txt", "w", encoding="utf-8") as f:
    f.write("MOCK DATA GENERADA:\n\n")
    for item in mock_listado:
        f.write(item + "\n")

print("Mock data NUEVA insertada correctamente usando los flujos de negocio y firmas.")

