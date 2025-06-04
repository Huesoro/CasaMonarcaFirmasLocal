import os
import datetime as dt
import hashlib
from pyhanko_certvalidator import ValidationContext
from pyhanko.sign import SimpleSigner, signers
from pyhanko.sign.fields import SigFieldSpec
from cryptography.hazmat.primitives import serialization
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa

def crear_certificado_usuario(email, nombre, password, carpeta_certs="certs"):
    """
    Crea un certificado autofirmado para el usuario y lo guarda en la carpeta indicada.
    Devuelve las rutas del certificado y la llave privada.
    """
    if not os.path.exists(carpeta_certs):
        os.makedirs(carpeta_certs)
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, nombre),
        x509.NameAttribute(NameOID.EMAIL_ADDRESS, email),
    ])
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        dt.datetime.utcnow()
    ).not_valid_after(
        dt.datetime.utcnow() + dt.timedelta(days=365)
    ).sign(key, hashes.SHA256())

    cert_path = os.path.join(carpeta_certs, f"{email}_cert.pem")
    key_path = os.path.join(carpeta_certs, f"{email}_key.pem")
    with open(cert_path, "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))
    with open(key_path, "wb") as f:
        f.write(key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.BestAvailableEncryption(password.encode())
        ))
    return cert_path, key_path