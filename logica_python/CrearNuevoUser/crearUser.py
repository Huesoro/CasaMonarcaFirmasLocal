import hashlib
import datetime as dt
import crearCertificado

from Azure_SQL.conectBases import insert_user

def crear_usuario(email, nombre, password, role, insert_user_func, carpeta_certs="certs"):
    """
    Crea un usuario en la base de datos y genera su certificado digital.
    """
    # Hashear la contraseña
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    now = dt.datetime.now()
    user_data = {
        "email": email,
        "name": nombre,
        "hashed_password": hashed_password,
        "created_at": now,
        "updated_at": now,
        "role": role
    }
    # Insertar usuario en la base de datos
    insert_user_func(user_data)
    # Crear certificado digital
    cert_path, key_path = crear_certificado_usuario(email, nombre, password, carpeta_certs)
    print(f"Certificado creado en: {cert_path}")
    print(f"Llave privada creada en: {key_path}")