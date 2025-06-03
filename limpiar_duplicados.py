import sqlite3

def limpiar_duplicados():
    conn = sqlite3.connect('Azure_SQL/Firmas.db')
    cursor = conn.cursor()
    
    try:
        # Crear una tabla temporal con los registros únicos
        cursor.execute("""
            CREATE TABLE temp_firmas AS
            SELECT DISTINCT *
            FROM firmas_documento
        """)
        
        # Eliminar la tabla original
        cursor.execute("DROP TABLE firmas_documento")
        
        # Renombrar la tabla temporal
        cursor.execute("ALTER TABLE temp_firmas RENAME TO firmas_documento")
        
        # Crear índices necesarios
        cursor.execute("""
            CREATE INDEX idx_firmas_doc_id 
            ON firmas_documento(doc_id)
        """)
        
        cursor.execute("""
            CREATE INDEX idx_firmas_user_role 
            ON firmas_documento(user_id, role)
        """)
        
        conn.commit()
        print("Registros duplicados eliminados correctamente")
        
    except sqlite3.Error as e:
        print(f"Error al limpiar duplicados: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    limpiar_duplicados() 