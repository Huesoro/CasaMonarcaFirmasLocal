from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import datetime
import os

def generar_certificado(email, password):
    # Crear el directorio si no existe
    if not os.path.exists('certs'):
        os.makedirs('certs')
    
    # Generar llave privada
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )
    
    # Crear el certificado
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, email),
        x509.NameAttribute(NameOID.EMAIL_ADDRESS, email),
    ])
    
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        private_key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.datetime.utcnow()
    ).not_valid_after(
        datetime.datetime.utcnow() + datetime.timedelta(days=365)
    ).sign(private_key, hashes.SHA256())
    
    # Guardar la llave privada
    with open(f"certs/{email}_key.pem", "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.BestAvailableEncryption(password.encode())
        ))
    
    # Guardar el certificado
    with open(f"certs/{email}_cert.pem", "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))
    
    print(f"Certificados generados para {email}")

if __name__ == "__main__":
    # Lista de usuarios que necesitan certificados
    usuarios = [
        ("admin@casamonarca.org", "admin123"),
        ("finanzas@casamonarca.org", "finanzas123"),
        ("inventario@casamonarca.org", "inventario123"),
        ("recepcion@casamonarca.org", "recepcion123")
    ]
    
    for email, password in usuarios:
        generar_certificado(email, password) 