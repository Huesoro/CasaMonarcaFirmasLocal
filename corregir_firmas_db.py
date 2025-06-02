import sqlite3

def corregir_estructura_tabla():
    conn = sqlite3.connect('Azure_SQL/firmas.db')
    cursor = conn.cursor()
    
    try:
        # Respaldar datos existentes
        cursor.execute("SELECT doc_id, user_id, role, fecha_firma, status, orden, comentario FROM firmas_documento")
        datos_existentes = cursor.fetchall()
        
        # Eliminar tabla actual
        cursor.execute("DROP TABLE IF EXISTS firmas_documento")
        
        # Crear tabla con estructura correcta
        cursor.execute("""
            CREATE TABLE firmas_documento (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                doc_id TEXT,
                user_id INTEGER,
                role TEXT,
                fecha_firma DATETIME,
                status TEXT,
                orden INTEGER,
                comentario TEXT
            )
        """)
        
        # Reinsertar datos existentes
        if datos_existentes:
            cursor.executemany("""
                INSERT INTO firmas_documento 
                (doc_id, user_id, role, fecha_firma, status, orden, comentario)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, datos_existentes)
        
        conn.commit()
        print("Estructura de la tabla corregida exitosamente")
        
    except sqlite3.Error as e:
        print(f"Error al corregir la estructura: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    corregir_estructura_tabla() 