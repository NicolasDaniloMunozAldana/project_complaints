## Changelog


### [0.0.2] - 2025-09-24
#### Added
- **Delete complaints with admin password**: Admins can securely delete complaints by providing a valid administrator password, ensuring only authorized removals.
- **Change complaint status**: The status of each complaint (e.g., pending, resolved, closed) can be updated by authorized users or admins, supporting workflow management.
- **Add comments to complaints**: Users and/or admins can add comments to individual complaints, enabling discussion, clarification, or follow-up on each case.

### [0.0.1] - 2025-08-19
#### Added
- **Add complaints**: Users can submit new complaints through the web interface, providing details such as the entity and description.
- **List complaints**: All complaints are displayed in a dedicated list view, allowing users to browse and review submitted complaints.
- **List complaint reports**: A report view aggregates and displays complaint statistics for analysis.
# Project Complaints

This project is a web application for complaint management and visualization, developed as part of a Software Engineering course. The project implements a clean, decoupled architecture following SOLID principles.

## Main Features
- **Complaint Management**: Full listing and visualization of complaints.
- **Statistics**: Dashboard with complaint metrics and analytics.
- **Homepage**: Main interface of the system.
- **Robust Backend**: Express.js with layered architecture.
- **Database**: MySQL with Sequelize ORM.
- **Dynamic Views**: EJS templates for the frontend.
- **Authentication Microservice Integration**: Consumes an external authentication microservice for user login, session validation, and logout.
- **Email Notifications**: Decoupled email system with Gmail support.
- **Testing**: Complete test suite using Jest and Supertest.
- **Linting**: ESLint configuration for code quality.
- **CI/CD**: GitHub Actions workflow for continuous integration.
- **Layered Architecture**: Models, repositories, services, and validators for clean separation of concerns.

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

## Authentication Microservice Integration

This project integrates with an external **authentication microservice** to handle user authentication and session management. The microservice provides the following endpoints:

- **POST /api/auth/login** - Authenticates a user with username and password
- **GET /api/auth/validate** - Validates if a user has an active session
- **POST /api/auth/logout** - Closes a user's session

### Configuration

The authentication service URL is configured via the `AUTH_SERVICE_URL` environment variable:

```env
AUTH_SERVICE_URL=http://localhost:4000
```

### Implementation Details

- **Service Layer**: `src/services/authService.js` handles all HTTP requests to the auth microservice
- **Controller**: `src/controllers/authController.js` processes authentication requests from the frontend
- **Routes**: `src/routes/authRoutes.js` defines the authentication endpoints
- **Integration**: The complaint service validates user sessions before allowing delete or status change operations

### Error Handling

The auth service includes robust error handling:
- Returns appropriate HTTP status codes
- Handles microservice unavailability (503 Service Unavailable)
- Provides clear error messages for debugging

## Project Structure
```
project_complaints/
├── package.json
├── .env
├── .gitignore
├── README.md
├── EMAIL_ARCHITECTURE.md       # Email architecture documentation
├── RESUMEN_IMPLEMENTACION.md   # Implementation summary
├── demo-email-service.js       # Email demo script
├── test-email-integration.js   # Email integration tests
├── eslint.config.mjs           # ESLint configuration
├── migrations/                 # Sequelize database migrations
├── sources/
│   ├── dbcomplaints.sql       # Database script
│   └── images/                 # SVG icons
├── src/
│   ├── index.js                # Entry point
│   ├── config/                 # Configuration files
│   │   ├── constants.js
│   │   └── db.js
│   ├── controllers/            # MVC controllers
│   │   ├── authController.js
│   │   ├── complaintsController.js
│   │   └── homeController.js
│   ├── interfaces/             # Contracts/Interfaces
│   │   └── IEmailService.js
│   ├── middlewares/            # Express middlewares
│   │   └── emailNotifications.js
│   ├── models/                 # Sequelize data models
│   │   ├── comment.js
│   │   ├── complaint.js
│   │   ├── entity.js
│   │   └── user.js
│   ├── repositories/           # Data access layer
│   │   └── complaintsRepository.js
│   ├── routes/                 # Route definitions
│   │   ├── authRoutes.js
│   │   ├── complaintsRoutes.js
│   │   └── homeRoutes.js
│   ├── services/               # Business services
│   │   ├── authService.js      # Auth microservice integration
│   │   ├── complaintService.js # Complaint business logic
│   │   ├── EmailServiceFactory.js
│   │   └── GmailEmailService.js
│   ├── utils/                  # Utilities
│   │   ├── emailService.js
│   │   └── emailService.js.backup
│   ├── validators/             # Input validation layer
│   │   └── complaintsValidator.js
│   └── views/                  # EJS templates
│       ├── complaints_list.ejs
│       ├── complaints_stats.ejs
│       └── home.ejs
├── test/
│   └── app.test.js             # Test suite
└── .github/
    └── workflows/
        └── test.yml            # GitHub Actions CI/CD
```

## Naming Conventions

To ensure consistency and traceability across the project, the following naming conventions **must** be used for issues, branches, and pull requests. This structure is based on [Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) and includes a unique project identifier (`KAN`) for improved tracking.

### Issue Naming

All issues must be named using the following format:

```
[KAN-XX] Issue Title
```

- `KAN` is the project identifier and **must** always be uppercase.
- `XX` is the issue number.
- The title should be concise and clearly describe the issue.
- Example:  
  ```
  [KAN-47] Update readme to follow the new standard structure for naming branches, issues and pull requests
  ```

### Branch Naming

Branches must follow the [Gitflow branching model](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) with the addition of the project identifier and issue number.

```
<type>/(KAN-XX)-branch-name
```

- `<type>`: The Gitflow prefix (e.g., `feature`, `bugfix`, `hotfix`, `release`).
- `(KAN-XX)`: The project identifier and issue number, in parentheses, immediately after the Gitflow prefix. `KAN` must be uppercase.
- `branch-name`: A concise, kebab-case description of the branch purpose.
- Example:  
  ```
  feature/(KAN-46)-add-status-to-complaints
  bugfix/(KAN-51)-fix-email-validation
  ```

### Pull Request Naming

Pull requests should use the same structure as branches, with the Gitflow type as a prefix. If the pull request is for documentation, add a `Docs/` prefix before the Gitflow type.

```
<Type>/(KAN-XX) Branch Title
```
or, for documentation:
```
Docs/<Type>/(KAN-XX) Branch Title
```

- `<Type>`: The Gitflow type, capitalized (e.g., `Feature`, `Bugfix`, `Hotfix`, `Release`).
- `(KAN-XX)`: The project identifier and issue number, in parentheses, immediately after the type.
- `Branch Title`: Short, descriptive, and in [title case](https://capitalizemytitle.com/) or plain English.
- For documentation pull requests, start the title with `Docs/`.
- Examples:  
  ```
  Feature/(KAN-46) Add status to complaints
  Bugfix/(KAN-51) Fix email validation
  Docs/Feature/(KAN-50) Update README with naming conventions
  ```

**Summary Table:**

| Entity         | Format                                         | Example                                           |
|----------------|------------------------------------------------|---------------------------------------------------|
| Issue          | `[KAN-XX] Issue title`                         | `[KAN-47] Update readme to follow the new standard structure...` |
| Branch         | `type/(KAN-XX)-branch-name`                    | `feature/(KAN-46)-add-status-to-complaints`       |
| Pull Request   | `Type/(KAN-XX) Branch Title`                   | `Feature/(KAN-46) Add status to complaints`       |
| PR (Docs)      | `Docs/Type/(KAN-XX) Branch Title`              | `Docs/Feature/(KAN-50) Update README with naming conventions` |

**Guidelines:**
- Always keep `KAN` in uppercase and the issue number zero-padded if needed.
- The `(KAN-XX)` identifier is mandatory in branches and pull requests for tracking.
- Use descriptive, concise titles for issues, branches, and pull requests.

---

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
   Edit the `.env` file with your MySQL database credentials, Gmail configuration, and authentication service URL:
   
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_NAME=your_database
   
   # Server
   PORT=3030
   
   # Authentication Microservice
   AUTH_SERVICE_URL=http://localhost:4000
   
   # reCAPTCHA
   RECAPTCHA_SECRET=your_recaptcha_secret
   
   # Email (Gmail)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   
   # Admin Password
   ADMIN_PASSWORD=your_admin_password
   ```

4. **Set up the database:**
   
   **For new installations:**
   
   Create the database and run migrations using Sequelize CLI:
   
   ```bash
   # Create database (if not exists)
   mysql -u your_user -p -e "CREATE DATABASE IF NOT EXISTS your_database;"
   
   # Run all migrations
   npx sequelize-cli db:migrate
   ```
   
   **For existing installations (applying new migrations):**
   
   ```bash
   # Run pending migrations
   npx sequelize-cli db:migrate
   ```
   
   **Rollback migrations (if needed):**
   
   ```bash
   # Undo last migration
   npx sequelize-cli db:migrate:undo
   
   # Undo all migrations
   npx sequelize-cli db:migrate:undo:all
   ```
   
   Make sure the credentials in `.env` are correct before running migrations.

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

## Usage

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

## Testing
To run the tests:
```powershell
npm test
```

## Main Dependencies

### Production
- **express** - Web framework for Node.js
- **sequelize** - ORM for MySQL and other SQL databases
- **mysql2** - MySQL driver for Node.js
- **ejs** - Template engine
- **axios** - HTTP client
- **dotenv** - Environment variable management
- **nodemailer** - Email sending

### Development and Testing
- **jest** - Testing framework
- **supertest** - HTTP API testing
- **sequelize-cli** - Sequelize command line interface for migrations
- **eslint** - JavaScript linter
- **@eslint/js** - ESLint configurations
- **eslint** - JavaScript linter
- **@eslint/js** - ESLint configurations

## Authors

- **Luis Enrique Hernández Valbuena** - [@Luisen1](https://github.com/Luisen1)
- **Kevin Johann Jimenez Poveda** - [@KevP2051](https://github.com/KevP2051)
- **Nicolas Danilo Muñoz Aldana** - [@NicolasDaniloMunozAldana](https://github.com/NicolasDaniloMunozAldana)
