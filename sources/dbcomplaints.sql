CREATE TABLE PUBLIC_ENTITYS (
    id_public_entity INT NOT NULL,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE COMPLAINTS (
    id_complaint INT NOT NULL,
    id_public_entity INT NOT NULL,
    description VARCHAR(500),
    status TINYINT(1) DEFAULT 1 NOT NULL,
    complaint_status ENUM('abierta', 'en_revision', 'cerrada') DEFAULT 'abierta' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE PUBLIC_ENTITYS 
MODIFY id_public_entity INT NOT NULL AUTO_INCREMENT PRIMARY KEY;

ALTER TABLE COMPLAINTS 
MODIFY id_complaint INT NOT NULL AUTO_INCREMENT PRIMARY KEY;

ALTER TABLE COMPLAINTS
ADD CONSTRAINT FK_COMPLAINT_PUBLIC_ENTITY
FOREIGN KEY (id_public_entity) REFERENCES PUBLIC_ENTITYS(id_public_entity);

-- Insert status column in case the table already exists
ALTER TABLE COMPLAINTS
ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1;

-- Add complaint_status column for complaint states
ALTER TABLE COMPLAINTS
ADD COLUMN complaint_status ENUM('abierta', 'en_revision', 'cerrada') DEFAULT 'abierta' NOT NULL;

ALTER TABLE COMPLAINTS
MODIFY status TINYINT(1) NOT NULL DEFAULT 1
CHECK (status IN (0,1));

INSERT INTO PUBLIC_ENTITYS (id_public_entity, name) VALUES
(1, 'Gobernación de Boyacá'),
(2, 'Secretaría de Salud de Boyacá'),
(3, 'INDEPORTES Boyacá'),
(4, 'Instituto de Tránsito de Boyacá (ITBOY)'),
(5, 'Alcaldia Mayor de Tunja');

-- Crear tabla para comentarios anónimos
CREATE TABLE ANONYMOUS_COMMENTS (
    id_comment INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_complaint INT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TINYINT(1) DEFAULT 1 NOT NULL,
    CONSTRAINT FK_COMMENT_COMPLAINT 
        FOREIGN KEY (id_complaint) REFERENCES COMPLAINTS(id_complaint) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_comment_length 
        CHECK (CHAR_LENGTH(TRIM(comment_text)) >= 10),
    CONSTRAINT chk_comment_status 
        CHECK (status IN (0,1))
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_comments_complaint ON ANONYMOUS_COMMENTS(id_complaint);
CREATE INDEX idx_comments_created_at ON ANONYMOUS_COMMENTS(created_at);
CREATE INDEX idx_complaints_created_at ON COMPLAINTS(created_at);