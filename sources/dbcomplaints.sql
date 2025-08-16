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
ADD CONSTRAINT PK_PUBLIC_ENTITY PRIMARY KEY (id_public_entity);

ALTER TABLE COMPLAINTS
ADD CONSTRAINT PK_COMPLAINT PRIMARY KEY (id_complaint);

ALTER TABLE COMPLAINTS
ADD CONSTRAINT FK_COMPLAINT_PUBLIC_ENTITY
FOREIGN KEY (id_public_entity) REFERENCES PUBLIC_ENTITYS(id_public_entity);

INSERT INTO PUBLIC_ENTITYS (id_public_entity, name) VALUES
(1, 'Ministerio de Salud y Protección Social'),
(2, 'Ministerio de Educación Nacional'),
(3, 'Ministerio de Transporte'),
(4, 'Policía Nacional de Colombia'),
(5, 'Registraduría Nacional del Estado Civil');

INSERT INTO COMPLAINTS (id_complaint, id_public_entity, description) VALUES
(1, 1, 'Falta de atención en el hospital local'),
(2, 2, 'Problemas con la entrega de certificados académicos'),
(3, 3, 'Carreteras en mal estado en la vía principal'),
(4, 4, 'Demora en el trámite de antecedentes'),
(5, 5, 'Errores en el registro civil de nacimiento'),
(6, 1, 'Falta de medicamentos en la red hospitalaria'),
(7, 2, 'Demora en la entrega de becas estudiantiles'),
(8, 3, 'Señalización insuficiente en carreteras'),
(9, 4, 'Falta de patrullaje en barrios residenciales'),
(10, 5, 'Problemas en la inscripción de cédulas nuevas');