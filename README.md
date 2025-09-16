# Project Complaints

Este proyecto es una aplicación web para la gestión y visualización de quejas, desarrollada como parte de un curso de Ingeniería de Software. El proyecto implementa una arquitectura limpia y desacoplada con principios SOLID.

## Características principales
- **Gestión de Quejas**: Listado completo y visualización de quejas
- **Estadísticas**: Dashboard con métricas y análisis de quejas
- **Página de inicio**: Interfaz principal del sistema
- **Backend robusto**: Express.js con arquitectura en capas
- **Base de datos**: MySQL con Knex.js como query builder
- **Vistas dinámicas**: Plantillas EJS para el frontend
- **Notificaciones Email**: Sistema de email desacoplado con soporte Gmail
- **Testing**: Suite completa de pruebas con Jest y Supertest
- **Linting**: Configuración ESLint para calidad de código
- **CI/CD**: Workflow de GitHub Actions para integración continua

## Arquitectura de Email Desacoplada

El proyecto incluye una **arquitectura de email completamente refactorizada** que implementa:

- **Clean Architecture** y principios **SOLID**
- **Factory Pattern** + **Singleton Pattern**
- **Interface-based design** para extensibilidad
- **Soporte Gmail** con validación de credenciales
- **Compatibilidad backward** con implementación anterior
- **Plantillas HTML responsivas**
- **Manejo robusto de errores**

Para más detalles, consulta [`EMAIL_ARCHITECTURE.md`](./EMAIL_ARCHITECTURE.md) y [`RESUMEN_IMPLEMENTACION.md`](./RESUMEN_IMPLEMENTACION.md).

## 📁 Estructura del proyecto
```
project_complaints/
├── 📄 package.json
├── 🔐 .env
├── 📝 .gitignore
├── 📋 README.md
├── 📚 EMAIL_ARCHITECTURE.md       # Documentación arquitectura email
├── 📊 RESUMEN_IMPLEMENTACION.md   # Resumen de implementaciones
├── 🧪 demo-email-service.js       # Script demostración email
├── 🔧 test-email-integration.js   # Pruebas integración email
├── ⚙️ eslint.config.mjs           # Configuración ESLint
├── 📂 sources/
│   ├── 🗄️ dbcomplaints.sql       # Script base de datos
│   └── 🖼️ images/                 # Iconos SVG
├── 📂 src/
│   ├── 🚀 index.js                # Punto de entrada
│   ├── 📂 config/                 # Configuraciones
│   │   ├── constants.js
│   │   └── db.js
│   ├── 📂 controllers/            # Controladores MVC
│   │   ├── complaintsController.js
│   │   └── homeController.js
│   ├── 📂 interfaces/             # Contratos/Interfaces
│   │   └── IEmailService.js
│   ├── 📂 middlewares/            # Middlewares Express
│   │   └── emailNotifications.js
│   ├── 📂 routes/                 # Definición de rutas
│   │   ├── complaintsRoutes.js
│   │   └── homeRoutes.js
│   ├── 📂 services/               # Servicios de negocio
│   │   ├── EmailServiceFactory.js
│   │   └── GmailEmailService.js
│   ├── 📂 utils/                  # Utilidades
│   │   ├── emailService.js
│   │   └── emailService.js.backup
│   └── 📂 views/                  # Plantillas EJS
│       ├── complaints_list.ejs
│       ├── complaints_stats.ejs
│       └── home.ejs
├── 📂 test/
│   └── 🧪 app.test.js             # Suite de pruebas
└── 📂 .github/
    └── 📂 workflows/
        └── ⚙️ test.yml            # GitHub Actions CI/CD
```

## Instalación

1. **Clona el repositorio:**
   ```powershell
   git clone <repository-url>
   cd project_complaints
   ```

2. **Instala las dependencias:**
   ```powershell
   npm install
   ```

3. **Configura el archivo `.env`:**
   ```powershell
   cp example.env .env
   ```
   Edita el archivo `.env` con tus credenciales de base de datos MySQL y configuración de Gmail.

4. **Configura la base de datos:**
   - Importa el archivo `sources/dbcomplaints.sql` en tu base de datos MySQL
   - Asegúrate de que las credenciales en `.env` sean correctas

5. **Configura Gmail (opcional para notificaciones):**
   - Habilita la verificación en 2 pasos en tu cuenta Gmail
   - Genera una contraseña de aplicación
   - Configura las variables `GMAIL_USER` y `GMAIL_PASS` en `.env`

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

## 🚀 Uso

### Servidor de desarrollo
Para iniciar el servidor:
```powershell
npm start
# o directamente
node src/index.js
```

### Scripts disponibles
```powershell
# Ejecutar pruebas
npm test

# Linting del código
npm run lint

# Corregir automáticamente problemas de linting
npm run lint:fix
```

### Demo del servicio de email
```powershell
# Probar la nueva arquitectura de email
node demo-email-service.js

# Pruebas de integración de email
node test-email-integration.js
```

## 🧪 Pruebas
Para ejecutar las pruebas:
```powershell
npm test
```

## 📦 Dependencias principales

### Producción
- **express** - Framework web para Node.js
- **knex** - Query builder SQL
- **mysql2** - Driver MySQL para Node.js
- **ejs** - Motor de plantillas
- **axios** - Cliente HTTP
- **dotenv** - Gestión de variables de entorno
- **nodemailer** - Envío de emails

### Desarrollo y Testing
- **jest** - Framework de testing
- **supertest** - Testing de APIs HTTP
- **eslint** - Linter para JavaScript
- **@eslint/js** - Configuraciones ESLint

## 👥 Autores

- **Luis Enrique Hernández Valbuena** - [@Luisen1](https://github.com/Luisen1)
- **Kevin Johann Jimenez Poveda** - [@KevP2051](https://github.com/KevP2051)
- **Nicolas Danilo Muñoz Aldana** - [@NicolasDaniloMunozAldana](https://github.com/NicolasDaniloMunozAldana)


