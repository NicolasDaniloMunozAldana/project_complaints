-- Actualizaciones de base de datos para comentarios anónimos y fechas de creación
-- Ejecutar después de la creación inicial de la base de datos

-- 1. Agregar campo created_at a la tabla COMPLAINTS
ALTER TABLE COMPLAINTS 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Agregar campo updated_at para seguimiento de cambios
ALTER TABLE COMPLAINTS 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 3. Crear tabla para comentarios anónimos
CREATE TABLE ANONYMOUS_COMMENTS (
    id_comment INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_complaint INT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TINYINT(1) DEFAULT 1 NOT NULL,
    CONSTRAINT FK_COMMENT_COMPLAINT 
        FOREIGN KEY (id_complaint) REFERENCES COMPLAINTS(id_complaint) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Crear índices para mejorar el rendimiento
CREATE INDEX idx_comments_complaint ON ANONYMOUS_COMMENTS(id_complaint);
CREATE INDEX idx_comments_created_at ON ANONYMOUS_COMMENTS(created_at);
CREATE INDEX idx_complaints_created_at ON COMPLAINTS(created_at);

-- 5. Agregar restricción de longitud mínima para comentarios
ALTER TABLE ANONYMOUS_COMMENTS 
ADD CONSTRAINT chk_comment_length 
CHECK (CHAR_LENGTH(TRIM(comment_text)) >= 10);

-- 6. Agregar restricción para asegurar que solo comentarios activos son visibles
ALTER TABLE ANONYMOUS_COMMENTS
MODIFY status TINYINT(1) NOT NULL DEFAULT 1
CHECK (status IN (0,1));

-- 7. Actualizar fechas para quejas existentes (opcional - solo si hay datos)
-- UPDATE COMPLAINTS SET created_at = NOW() WHERE created_at IS NULL;