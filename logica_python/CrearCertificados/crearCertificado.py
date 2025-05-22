import os
import datetime as dt
import hashlib
from pyhanko_certvalidator import ValidationContext
from pyhanko.sign import SimpleSigner, signers
from pyhanko_certgen import generate_self_signed
from pyhanko.sign.fields import SigFieldSpec
from cryptography.hazmat.primitives import serialization

def crear_certificado_usuario(email, nombre, password, carpeta_certs="certs"):
    """
    Crea un certificado autofirmado para el usuario y lo guarda en la carpeta indicada.
    Devuelve las rutas del certificado y la llave privada.
    """
    if not os.path.exists(carpeta_certs):
        os.makedirs(carpeta_certs)
    common_name = nombre.replace(" ", "_")
    cert, key = generate_self_signed(common_name=common_name)
    cert_path = os.path.join(carpeta_certs, f"{email}_cert.pem")
    key_path = os.path.join(carpeta_certs, f"{email}_key.pem")
    with open(cert_path, "wb") as f:
        f.write(cert.dump())
    with open(key_path, "wb") as f:
        f.write(key.key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.BestAvailableEncryption(password.encode())
        ))
    return cert_path, key_path