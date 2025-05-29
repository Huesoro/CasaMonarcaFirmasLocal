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
        conn = sqlite3.connect('Azure_SQL/Usuarios.db')
        cursor = conn.cursor()
        
        # Preparar la consulta SQL con el orden correcto de columnas
        insert_query = """
        INSERT INTO usuarios (role, email, name, hashed_password, created_at, updated_at)
        VALUES (:role, :email, :name, :hashed_password, :created_at, :updated_at)
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
        doc_data (dict): Diccionario con los datos del documento, debe incluir doc_id (UUID)
    """
    try:
        conn = sqlite3.connect('Azure_SQL/Documentos.db')
        cursor = conn.cursor()
        insert_query = """
        INSERT INTO documentos (doc_id, title, sharepoint_url, Type, status, user_id, created_at, updated_at)
        VALUES (:doc_id, :title, :sharepoint_url, :Type, :status, :user_id, :created_at, :updated_at)
        """
        cursor.execute(insert_query, doc_data)
        conn.commit()
        print("Documento insertado exitosamente")
    except sqlite3.Error as e:
        print(f"Error al insertar documento: {e}")
    finally:
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
        conn = sqlite3.connect('Azure_SQL/DonacionesDinero.db')
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
        conn = sqlite3.connect('Azure_SQL/DonacionesInsumos.db')
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

def get_all_documents():
    """
    Obtiene todos los documentos de la base de datos Documentos.db
    Devuelve una lista de diccionarios con los datos de cada documento
    """
    try:
        conn = sqlite3.connect('Azure_SQL/Documentos.db')
        cursor = conn.cursor()
        select_query = """
        SELECT doc_id, title, sharepoint_url, Type, status, user_id, created_at, updated_at FROM documentos
        """
        cursor.execute(select_query)
        rows = cursor.fetchall()
        documentos = []
        for row in rows:
            documentos.append({
                "doc_id": row[0],
                "title": row[1],
                "sharepoint_url": row[2],
                "Type": row[3],
                "status": row[4],
                "user_id": row[5],
                "created_at": row[6],
                "updated_at": row[7],
            })
        return documentos
    except sqlite3.Error as e:
        print(f"Error al obtener documentos: {e}")
        return []
    finally:
        if conn:
            conn.close()

def get_all_donaciones_dinero():
    """
    Obtiene todas las donaciones de dinero de la base de datos DonacionesDinero.db
    Devuelve una lista de diccionarios con los datos de cada donación
    """
    try:
        conn = sqlite3.connect('Azure_SQL/DonacionesDinero.db')
        cursor = conn.cursor()
        select_query = """
        SELECT id, amount, user_id, created_at, updated_at, doc_id FROM donacionesdinero
        """
        cursor.execute(select_query)
        rows = cursor.fetchall()
        donaciones = []
        for row in rows:
            donaciones.append({
                "id": row[0],
                "amount": row[1],
                "user_id": row[2],
                "created_at": row[3],
                "updated_at": row[4],
                "doc_id": row[5],
            })
        return donaciones
    except sqlite3.Error as e:
        print(f"Error al obtener donaciones de dinero: {e}")
        return []
    finally:
        if conn:
            conn.close()


def get_all_donaciones_insumos():
    """
    Obtiene todas las donaciones de insumos de la base de datos DonacionesInsumos.db
    Devuelve una lista de diccionarios con los datos de cada donación
    """
    try:
        conn = sqlite3.connect('Azure_SQL/DonacionesInsumos.db')
        cursor = conn.cursor()
        select_query = """
        SELECT id, amount, objeto, user_id, created_at, updated_at, doc_id FROM donacionesinsumos
        """
        cursor.execute(select_query)
        rows = cursor.fetchall()
        donaciones = []
        for row in rows:
            donaciones.append({
                "id": row[0],
                "amount": row[1],
                "objeto": row[2],
                "user_id": row[3],
                "created_at": row[4],
                "updated_at": row[5],
                "doc_id": row[6],
            })
        return donaciones
    except sqlite3.Error as e:
        print(f"Error al obtener donaciones de insumos: {e}")
        return []
    finally:
        if conn:
            conn.close()

def insertar_flujo_firmas(doc_id, creador_id, tipo_donacion):
    # Paso 1: Creador
    pasos = []
    conn = sqlite3.connect('Azure_SQL/Firmas.db')
    cursor = conn.cursor()
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn2 = sqlite3.connect('Azure_SQL/Usuarios.db')
    cursor2 = conn2.cursor()
    # 1. Creador
    cursor2.execute("SELECT role FROM usuarios WHERE user_id = ?", (creador_id,))
    rol_creador = cursor2.fetchone()[0]
    pasos.append((doc_id, creador_id, rol_creador, None, "pendiente", 1, None))
    # 2. Segundo firmante
    if tipo_donacion == "especie":
        rol_siguiente = "inventory"
    else:
        rol_siguiente = "finance"
    pasos.append((doc_id, None, rol_siguiente, None, "pendiente", 2, None))
    # 3. Admin
    pasos.append((doc_id, None, "admin", None, "pendiente", 3, None))
    # Insertar pasos
    for p in pasos:
        cursor.execute("""
            INSERT INTO firmas_documento (doc_id, user_id, role, fecha_firma, status, orden, comentario)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, p)
    conn.commit()
    conn.close()

def get_documentos_para_firmar(user_id, rol):
    """
    Obtiene los documentos que el usuario/rol debe firmar o ya firmó según su posición en el flujo
    y las restricciones de su rol
    """
    try:
        conn_firmas = sqlite3.connect('Azure_SQL/firmas.db')
        cursor_firmas = conn_firmas.cursor()
        
        # Obtener el orden del usuario/rol
        cursor_firmas.execute("""
            SELECT orden FROM firmas_documento 
            WHERE (user_id = ? OR role = ?)
            ORDER BY orden ASC LIMIT 1
        """, (user_id, rol))
        
        resultado = cursor_firmas.fetchone()
        if not resultado:
            conn_firmas.close()
            return []
        
        orden_actual = resultado[0]
        
        # Obtener los doc_ids que están asignados a este usuario/rol
        # y donde todos los pasos anteriores están firmados
        cursor_firmas.execute("""
            WITH PasosAnteriores AS (
                SELECT doc_id, MAX(orden) as max_orden_anterior
                FROM firmas_documento
                WHERE orden < ?
                GROUP BY doc_id
            )
            SELECT f.doc_id, f.status 
            FROM firmas_documento f
            LEFT JOIN PasosAnteriores p ON f.doc_id = p.doc_id
            WHERE f.orden = ? 
            AND (f.user_id = ? OR f.role = ?)
            AND (
                p.max_orden_anterior IS NULL 
                OR EXISTS (
                    SELECT 1 
                    FROM firmas_documento fa 
                    WHERE fa.doc_id = f.doc_id 
                    AND fa.orden < f.orden 
                    AND fa.status = 'firmado'
                )
            )
        """, (orden_actual, orden_actual, user_id, rol))
        
        doc_ids = [row[0] for row in cursor_firmas.fetchall()]
        conn_firmas.close()
        
        if not doc_ids:
            return []
            
        # Ahora obtenemos la información completa de los documentos
        conn_docs = sqlite3.connect('Azure_SQL/Documentos.db')
        cursor_docs = conn_docs.cursor()
        
        # Construir la consulta base
        query = """
            SELECT doc_id, title, sharepoint_url, Type, status, user_id, created_at, updated_at
            FROM documentos 
            WHERE doc_id IN ({})
        """.format(','.join(['?' for _ in doc_ids]))
        
        # Agregar restricciones según el rol
        if rol == "reception":
            # Recepción solo ve sus propios documentos
            query += " AND user_id = ?"
            params = doc_ids + [user_id]
        elif rol == "finance":
            # Finanzas solo ve documentos de tipo dinero
            query += " AND Type = 'dinero'"
            params = doc_ids
        elif rol == "inventory":
            # Inventario solo ve documentos de tipo insumos
            query += " AND Type = 'insumos'"
            params = doc_ids
        elif rol == "admin":
            # Admin ve todo
            params = doc_ids
        else:
            # Para otros roles, no mostrar nada
            conn_docs.close()
            return []
        
        cursor_docs.execute(query, params)
        rows = cursor_docs.fetchall()
        
        # Obtener el estado de firma para cada documento
        conn_firmas = sqlite3.connect('Azure_SQL/firmas.db')
        cursor_firmas = conn_firmas.cursor()
        
        docs = []
        for row in rows:
            # Obtener el estado de firma para este documento y usuario/rol
            cursor_firmas.execute("""
                SELECT status, fecha_firma 
                FROM firmas_documento 
                WHERE doc_id = ? AND (user_id = ? OR role = ?)
            """, (row[0], user_id, rol))
            
            firma_info = cursor_firmas.fetchone()
            firma_status = firma_info[0] if firma_info else "pendiente"
            fecha_firma = firma_info[1] if firma_info else None
            
            # Si el documento está rechazado, asegurarnos de que se refleje en firma_status
            if firma_status == "rechazado":
                firma_status = "rechazado"
            
            docs.append({
                "doc_id": row[0],
                "title": row[1],
                "sharepoint_url": row[2],
                "Type": row[3],
                "status": row[4],
                "user_id": row[5],
                "created_at": row[6],
                "updated_at": row[7],
                "firma_status": firma_status,
                "fecha_firma": fecha_firma
            })
        
        conn_docs.close()
        conn_firmas.close()
        return docs
        
    except sqlite3.Error as e:
        print(f"Error en get_documentos_para_firmar: {e}")
        return []

def firmar_documento(doc_id, user_id, rol):
    """
    Marca un documento como firmado por el usuario/rol específico y lo pasa al siguiente en el flujo
    """
    conn = sqlite3.connect('Azure_SQL/firmas.db')
    cursor = conn.cursor()
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Obtener el orden actual del usuario/rol
    cursor.execute("""
        SELECT orden FROM firmas_documento 
        WHERE doc_id = ? AND (user_id = ? OR role = ?)
    """, (doc_id, user_id, rol))
    
    orden_actual = cursor.fetchone()[0]
    
    # Marcar como firmado el paso actual
    cursor.execute("""
        UPDATE firmas_documento 
        SET status = 'firmado', fecha_firma = ?
        WHERE doc_id = ? AND orden = ?
    """, (now, doc_id, orden_actual))
    
    # Obtener el siguiente paso
    cursor.execute("""
        SELECT orden FROM firmas_documento 
        WHERE doc_id = ? AND orden > ?
        ORDER BY orden ASC LIMIT 1
    """, (doc_id, orden_actual))
    
    siguiente_paso = cursor.fetchone()
    
    if siguiente_paso:
        # Actualizar el estado del siguiente paso a pendiente
        cursor.execute("""
            UPDATE firmas_documento 
            SET status = 'pendiente'
            WHERE doc_id = ? AND orden = ?
        """, (doc_id, siguiente_paso[0]))
    
    conn.commit()
    
    # Verificar si es el último paso
    cursor.execute("""
        SELECT MAX(orden) FROM firmas_documento WHERE doc_id = ?
    """, (doc_id,))
    
    ultimo_orden = cursor.fetchone()[0]
    
    if orden_actual == ultimo_orden:
        # Si es el último paso, marcar el documento como completamente firmado
        conn2 = sqlite3.connect('Azure_SQL/Documentos.db')
        cursor2 = conn2.cursor()
        cursor2.execute("UPDATE documentos SET status = 'signed' WHERE doc_id = ?", (doc_id,))
        conn2.commit()
        conn2.close()
    
    conn.close()