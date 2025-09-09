# Project Complaints

Este proyecto es una aplicación web para la gestión y visualización de quejas, desarrollada como parte de un curso de Ingeniería de Software.

## Características principales
- Listado de quejas
- Estadísticas de quejas
- Página de inicio
- Backend con Express y Knex
- Base de datos MySQL
- Vistas con EJS
- Pruebas con Jest y Supertest

## Estructura del proyecto
```
project_complaints/
├── package.json
├── package-lock.json
├── .env
├── .gitignore
├── sources/
│   ├── dbcomplaints.sql
│   └── images/
├── src/
│   └── index.js
├── test/
│   └── app.test.js
├── views/
│   ├── complaints_list.ejs
│   ├── complaints_stats.ejs
│   └── home.ejs
└── .github/
    └── workflows/

## Instalación
1. Clona el repositorio.
2. Instala las dependencias:
   ```powershell
   npm install
   ```
3. Configura el archivo `.env` con tus credenciales de base de datos MySQL.
4. Importa el archivo `sources/dbcomplaints.sql` en tu base de datos.

## Estructura para descripción de Pull Requests
La estructura sugerida para la descripción de los pull requests y el contenido que se sugiere incluir es el siguiente:

### Descripción
- Proporciona una explicación clara de los cambios realizados en este pull request.
- Qué se modificó, añadió o eliminó.
- Dónde se aplicó el cambio (p. ej., página principal, página de lista, servicio backend, etc.).
- Manténlo factual y específico (sin justificaciones aquí, solo lo que se cambió).

### Objetivo
- Explica el propósito del cambio.
- ¿Por qué fue necesaria esta modificación?
- ¿Qué problema resuelve o qué mejora aporta?
- Céntrate en la intención (p. ej., mejorar la usabilidad, corregir un error, optimizar el rendimiento).

### Impacto
- Describe las consecuencias del cambio.
- ¿Cómo afecta al sistema, a los usuarios o a otros módulos?
- Menciona cualquier mejora, limitación o riesgo potencial.

### Ejemplo: 

**Title**
  
feat: Decoupled Email Architecture with Gmail Support

**Description**
  
Implemented a decoupled architecture for email services.
Created the IEmailService interface to define the email service contract.

Implemented GmailEmailService with credential validation and email sending.

Introduced EmailServiceFactory to manage service instances (using the Singleton pattern).

Added a compatibility layer in emailService.js to preserve existing functionality.
Documented the new architecture in EMAIL_ARCHITECTURE.md and added a summary in RESUMEN_IMPLEMENTACION.md.
Added demo scripts and integration tests to validate functionality.

**Goal**

Decouple email sending logic to allow future integrations with different providers.

Improve maintainability and scalability of the email module.

Ensure backward compatibility with the previous implementation without breaking existing features.

**Impact**

Users: No immediate visible changes, since the compatibility layer preserves current behavior.

System: Now supports extensibility to other email providers without requiring changes to the existing code.

Risks: Credential validation in GmailEmailService may require adjustments in environments using Gmail-specific configurations (OAuth, app passwords).

## Uso
Para iniciar el servidor:
```powershell
node src/index.js
```

## Pruebas
Para ejecutar las pruebas:
```powershell
npm test
```

## Dependencias principales
- express
- knex
- mysql2
- ejs
- axios
- dotenv

## Autor
- Luis Enrique Hernández Valbuena 
- Kevin Johann Jimenez Poveda 
- Nicolas Danilo Muñoz 
