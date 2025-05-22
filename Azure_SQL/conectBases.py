# Hagamos la prueba para Usuarios.db
import sqlite3
import datetime as dt

def insert_user(user_data):
    """
    Inserta un nuevo usuario en la base de datos
    
    Args:
        user_data (dict): Diccionario con los datos del usuario
    """
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect('Usuarios.db')
        cursor = conn.cursor()
        
        # Preparar la consulta SQL
        insert_query = """
        INSERT INTO usuarios (email, name, hashed_password, created_at, updated_at)
        VALUES (:email, :name, :hashed_password, :created_at, :updated_at)
        """
        
        # Ejecutar la consulta
        cursor.execute(insert_query, user_data)
        
        # Confirmar la transacción
        conn.commit()
        print("Usuario insertado exitosamente")
        
    except sqlite3.Error as e:
        print(f"Error al insertar usuario: {e}")
        
    finally:
        # Cerrar la conexión
        if conn:
            conn.close()


def insert_doc(doc_data):
    """
    Inserta un nuevo documento en la base de datos Documentos.db
    
    Args:
        doc_data (dict): Diccionario con los datos del documento
    """
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect('Documentos.db')
        cursor = conn.cursor()
        
        # Preparar la consulta SQL
        insert_query = """
        INSERT INTO documentos (title, sharepoint_url, Type, status, user_id, created_at, updated_at)
        VALUES (:title, :sharepoint_url, :Type, :status, :user_id, :created_at, :updated_at)
        """
        
        # Ejecutar la consulta
        cursor.execute(insert_query, doc_data)
        
        # Confirmar la transacción
        conn.commit()
        print("Documento insertado exitosamente")
        
    except sqlite3.Error as e:
        print(f"Error al insertar documento: {e}")
        
    finally:
        # Cerrar la conexión
        if conn:
            conn.close()
            
# Insertar donación de dinero
def insert_donacion_dinero(don_data):
    """
    Inserta una nueva donación de dinero en la base de datos DonacionesDinero.db
    Args:
        don_data (dict): Diccionario con los datos de la donación
    """
    try:
        conn = sqlite3.connect('DonacionesDinero.db')
        cursor = conn.cursor()
        insert_query = """
        INSERT INTO donacionesdinero (amount, user_id, created_at, updated_at, doc_id)
        VALUES (:amount, :user_id, :created_at, :updated_at, :doc_id)
        """
        cursor.execute(insert_query, don_data)
        conn.commit()
        print("Donación de dinero insertada exitosamente")
    except sqlite3.Error as e:
        print(f"Error al insertar donación de dinero: {e}")
    finally:
        if conn:
            conn.close()

# Insertar donación de insumos
def insert_donacion_insumos(insumo_data):
    """
    Inserta una nueva donación de insumos en la base de datos DonacionesInsumos.db
    Args:
        insumo_data (dict): Diccionario con los datos de la donación de insumos
    """
    try:
        conn = sqlite3.connect('DonacionesInsumos.db')
        cursor = conn.cursor()
        insert_query = """
        INSERT INTO donacionesinsumos (amount, objeto, user_id, created_at, updated_at, doc_id)
        VALUES (:amount, :objeto, :user_id, :created_at, :updated_at, :doc_id)
        """
        cursor.execute(insert_query, insumo_data)
        conn.commit()
        print("Donación de insumos insertada exitosamente")
    except sqlite3.Error as e:
        print(f"Error al insertar donación de insumos: {e}")
    finally:
        if conn:
            conn.close()