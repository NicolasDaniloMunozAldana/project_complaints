CREATE TABLE PUBLIC_ENTITYS (
    id_public_entity INT NOT NULL,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE COMPLAINTS (
    id_complaint INT NOT NULL,
    id_public_entity INT NOT NULL,
    description VARCHAR(500)
);

ALTER TABLE PUBLIC_ENTITYS 
MODIFY id_public_entity INT NOT NULL AUTO_INCREMENT PRIMARY KEY;

ALTER TABLE COMPLAINTS 
MODIFY id_complaint INT NOT NULL AUTO_INCREMENT PRIMARY KEY;

ALTER TABLE COMPLAINTS
ADD CONSTRAINT FK_COMPLAINT_PUBLIC_ENTITY
FOREIGN KEY (id_public_entity) REFERENCES PUBLIC_ENTITYS(id_public_entity);

INSERT INTO PUBLIC_ENTITYS (id_public_entity, name) VALUES
(1, 'Gobernación de Boyacá'),
(2, 'Secretaría de Salud de Boyacá'),
(3, 'INDEPORTES Boyacá'),
(4, 'Instituto de Tránsito de Boyacá (ITBOY)'),
(5, 'Alcaldia Mayor de Tunja');