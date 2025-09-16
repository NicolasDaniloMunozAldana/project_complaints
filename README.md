# Project Complaints

This project is a web application for complaint management and visualization, developed as part of a Software Engineering course. The project implements a clean, decoupled architecture following SOLID principles.

## Main Features
- **Complaint Management**: Full listing and visualization of complaints.
- **Statistics**: Dashboard with complaint metrics and analytics.
- **Homepage**: Main interface of the system.
- **Robust Backend**: Express.js with layered architecture.
- **Database**: MySQL with Knex.js as the query builder.
- **Dynamic Views**: EJS templates for the frontend.
- **Email Notifications**: Decoupled email system with Gmail support.
- **Testing**: Complete test suite using Jest and Supertest.
- **Linting**: ESLint configuration for code quality.
- **CI/CD**: GitHub Actions workflow for continuous integration.

## Decoupled Email Architecture

The project includes a **fully refactored email architecture** implementing:

- **Clean Architecture** and **SOLID principles**
- **Factory Pattern** + **Singleton Pattern**
- **Interface-based design** for extensibility
- **Gmail support** with credential validation
- **Backward compatibility** with previous implementation
- **Responsive HTML templates**
- **Robust error handling**

For more details, see [`EMAIL_ARCHITECTURE.md`](./EMAIL_ARCHITECTURE.md) and [`RESUMEN_IMPLEMENTACION.md`](./RESUMEN_IMPLEMENTACION.md).

## 📁 Project Structure
```
project_complaints/
├── 📄 package.json
├── 🔐 .env
├── 📝 .gitignore
├── 📋 README.md
├── 📚 EMAIL_ARCHITECTURE.md       # Email architecture documentation
├── 📊 RESUMEN_IMPLEMENTACION.md   # Implementation summary
├── 🧪 demo-email-service.js       # Email demo script
├── 🔧 test-email-integration.js   # Email integration tests
├── ⚙️ eslint.config.mjs           # ESLint configuration
├── 📂 sources/
│   ├── 🗄️ dbcomplaints.sql       # Database script
│   └── 🖼️ images/                 # SVG icons
├── 📂 src/
│   ├── 🚀 index.js                # Entry point
│   ├── 📂 config/                 # Configuration files
│   │   ├── constants.js
│   │   └── db.js
│   ├── 📂 controllers/            # MVC controllers
│   │   ├── complaintsController.js
│   │   └── homeController.js
│   ├── 📂 interfaces/             # Contracts/Interfaces
│   │   └── IEmailService.js
│   ├── 📂 middlewares/            # Express middlewares
│   │   └── emailNotifications.js
│   ├── 📂 routes/                 # Route definitions
│   │   ├── complaintsRoutes.js
│   │   └── homeRoutes.js
│   ├── 📂 services/               # Business services
│   │   ├── EmailServiceFactory.js
│   │   └── GmailEmailService.js
│   ├── 📂 utils/                  # Utilities
│   │   ├── emailService.js
│   │   └── emailService.js.backup
│   └── 📂 views/                  # EJS templates
│       ├── complaints_list.ejs
│       ├── complaints_stats.ejs
│       └── home.ejs
├── 📂 test/
│   └── 🧪 app.test.js             # Test suite
└── 📂 .github/
    └── 📂 workflows/
        └── ⚙️ test.yml            # GitHub Actions CI/CD
```

## Installation

1. **Clone the repository:**
   ```powershell
   git clone https://github.com/NicolasDaniloMunozAldana/project_complaints.git
   cd project_complaints
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Configure the `.env` file:**
   ```powershell
   cp example.env .env
   ```
   Edit the `.env` file with your MySQL database credentials and Gmail configuration.

4. **Set up the database:**
   - Import the `sources/dbcomplaints.sql` file into your MySQL database.
   - Make sure the credentials in `.env` are correct.

5. **Configure Gmail (optional for notifications):**
   - Enable 2-step verification on your Gmail account.
   - Generate an app password.
   - Set the `GMAIL_USER` and `GMAIL_PASS` variables in `.env`.

## Pull Request Description Structure

The suggested structure for pull request descriptions and the content to include is as follows:

### Description
- Provide a clear explanation of the changes made in this pull request.
- Specify what was modified, added, or removed.
- Indicate where the change was applied (e.g., main page, list page, backend service, etc.).
- Keep it factual and specific (no justifications here, just what was changed).

### Goal
- Explain the purpose of the change.
- Why was this modification necessary?
- What problem does it solve or what improvement does it bring?
- Focus on the intent (e.g., improve usability, fix a bug, optimize performance).

### Impact
- Describe the consequences of the change.
- How does it affect the system, users, or other modules?
- Mention any improvements, limitations, or potential risks.

### Example:

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

## 🚀 Usage

### Development Server
To start the server:
```powershell
npm start
# or directly
node src/index.js
```

### Available Scripts
```powershell
# Run tests
npm test

# Lint code
npm run lint

# Automatically fix linting issues
npm run lint:fix
```

### Email Service Demo
```powershell
# Test the new email architecture
node demo-email-service.js

# Email integration tests
node test-email-integration.js
```

## 🧪 Testing
To run the tests:
```powershell
npm test
```

## 📦 Main Dependencies

### Production
- **express** - Web framework for Node.js
- **knex** - SQL query builder
- **mysql2** - MySQL driver for Node.js
- **ejs** - Template engine
- **axios** - HTTP client
- **dotenv** - Environment variable management
- **nodemailer** - Email sending

### Development and Testing
- **jest** - Testing framework
- **supertest** - HTTP API testing
- **eslint** - JavaScript linter
- **@eslint/js** - ESLint configurations

## 👥 Authors

- **Luis Enrique Hernández Valbuena** - [@Luisen1](https://github.com/Luisen1)
- **Kevin Johann Jimenez Poveda** - [@KevP2051](https://github.com/KevP2051)
- **Nicolas Danilo Muñoz Aldana** - [@NicolasDaniloMunozAldana](https://github.com/NicolasDaniloMunozAldana)
