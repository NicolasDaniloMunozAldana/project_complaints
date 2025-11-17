# Project Complaints

This project is a web application for complaint management and visualization, developed as part of a Software Engineering course. The project implements a clean, decoupled architecture following SOLID principles.

## Changelog

For a detailed history of changes, new features, and fixes across all versions, see [CHANGELOG.md](./CHANGELOG.md).

**Current Version:** 0.0.4

## Main Features
- **Complaint Management**: Full listing and visualization of complaints.
- **Statistics**: Dashboard with complaint metrics and analytics.
- **Homepage**: Main interface of the system.
- **Robust Backend**: Express.js with layered architecture.
- **Database**: MySQL with Sequelize ORM.
- **Dynamic Views**: EJS templates for the frontend.
- **Authentication Microservice Integration**: Consumes an external authentication microservice for user login, session validation, and logout.
- **Email Notifications**: Asynchronous email notifications via Kafka to external email service.
- **Event Sourcing**: Complete historical tracking of complaint status changes via Kafka streaming.
- **End-to-End Traceability**: Correlation IDs and centralized logging for tracking operations across microservices.
- **Log Viewer Dashboard**: Web-based interface for viewing, filtering, and analyzing application logs in real-time.
- **Testing**: Complete test suite using Jest and Supertest.
- **Linting**: ESLint configuration for code quality.
- **CI/CD**: GitHub Actions workflow for continuous integration.
- **Layered Architecture**: Models, repositories, services, and validators for clean separation of concerns.

## Email Notifications via Kafka

The project publishes email notification events to Kafka, which are consumed and sent by a separate email service (`project_email_sender`). This decoupled architecture provides:

- **Asynchronous processing**: Email sending doesn't block the main application
- **Scalability**: Email service can scale independently
- **Reliability**: Failed emails are handled via Dead Letter Queue (DLQ)
- **Separation of concerns**: Email logic is isolated in a dedicated service

The application publishes events to the `email-notifications` Kafka topic when complaints are created or updated. The actual email sending is handled by the `project_email_sender` microservice.

## Event Sourcing for Historical Tracking

The project implements **Event Sourcing** to maintain a complete, immutable history of all complaint status changes. Every time a complaint's status changes, an event is published to Kafka and consumed by the `project_historical` service.

### Architecture

- **Producer**: `ComplaintStatusEventPublisher` publishes status change events to the `complaint-status-events` Kafka topic
- **Consumer**: `project_historical` service consumes these events and stores them in `historical.complaint_status_history`
- **Streaming**: The consumer can replay all events from the beginning (`fromBeginning: true`)
- **Audit Trail**: Every change includes: complaint ID, previous status, new status, user who made the change, timestamp, and description

### Benefits

- **Complete audit trail**: Know exactly when and by whom each status change was made
- **Historical reconstruction**: Rebuild the state of any complaint at any point in time
- **Temporal queries**: Analyze how long complaints stayed in each status
- **Event replay**: Recover from failures by replaying all events
- **Immutable log**: Events are never modified or deleted

See `project_historical/ARCHITECTURE.md` for detailed documentation.

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
├── RESUMEN_IMPLEMENTACION.md   # Implementation summary
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
│   │   ├── homeController.js
│   │   └── logViewerController.js  # Log viewer API
│   ├── models/                 # Sequelize data models
│   │   ├── comment.js
│   │   ├── complaint.js
│   │   ├── entity.js
│   │   └── user.js
│   ├── repositories/           # Data access layer
│   │   ├── commentsRepository.js
│   │   ├── complaintsRepository.js
│   │   └── entitiesRepository.js
│   ├── routes/                 # Route definitions
│   │   ├── authRoutes.js
│   │   ├── complaintsRoutes.js
│   │   ├── homeRoutes.js
│   │   ├── loginRoutes.js
│   │   └── logViewerRoutes.js  # Log viewer routes
│   ├── services/               # Business services
│   │   ├── authService.js      # Auth microservice integration
│   │   ├── complaintService.js # Complaint business logic
│   │   ├── EmailPublisherService.js  # Kafka email publisher
│   │   ├── emailQueueService.js      # Email microservice client
│   │   ├── KafkaProducerService.js   # Kafka producer
│   │   └── logViewerService.js       # Log reading and parsing
│   ├── middlewares/            # Express middlewares
│   │   └── correlationId.js    # Correlation ID tracking
│   ├── utils/                  # Utilities
│   │   ├── emailHelpers.js     # Email helper functions
│   │   └── logger.js           # Winston logger
│   ├── validators/             # Input validation layer
│   │   └── complaintsValidator.js
│   └── views/                  # EJS templates
│       ├── complaints_list.ejs
│       ├── complaints_stats.ejs
│       ├── home.ejs
│       └── log_viewer.ejs      # Log viewer dashboard
├── logs/                       # Application logs (auto-rotated)
├── test/
│   └── app.test.js             # Test suite
└── .github/
    └── workflows/
        └── test.yml            # GitHub Actions CI/CD
```

## Logging and Traceability

This project implements comprehensive logging with end-to-end traceability using **Correlation IDs** and **Winston**. Each request is tracked from the frontend through multiple microservices.

### Documentation

- **[LOGGING.md](./LOGGING.md)** - Complete logging system documentation
- **[TRACEABILITY_GUIDE.md](./TRACEABILITY_GUIDE.md)** - Guide for implementing traceability across microservices
- **[MICROSERVICE_EVENT_SOURCING.md](./MICROSERVICE_EVENT_SOURCING.md)** - Event Sourcing microservice setup
- **[MICROSERVICE_EMAIL.md](./MICROSERVICE_EMAIL.md)** - Email microservice setup

### Key Features

- **Correlation IDs**: Unique identifiers for tracking requests across services
- **Structured Logging**: JSON logs with context and timestamps
- **Auto-rotation**: Daily log files with automatic cleanup
- **Microservice Support**: HTTP clients propagate correlation IDs to external services
- **Event Sourcing Integration**: Logs communication with event sourcing service
- **Email Queue Integration**: Tracks email requests to email microservice

### Log Viewer Dashboard

Access the log viewer at `/logs` to:

- **View Logs**: Browse all application logs with syntax highlighting
- **Filter by Level**: Show only errors, warnings, info, or debug logs
- **Search**: Find logs by message content, service name, or operation
- **Track Requests**: Search by correlation ID to trace requests across microservices
- **Statistics**: View log counts by level and service
- **Auto-refresh**: Dashboard updates every 30 seconds
- **Pagination**: Navigate through large log files efficiently

The dashboard provides a user-friendly interface for monitoring and troubleshooting the application without needing command-line access to log files.

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
- **kafkajs** - Kafka client for async email notifications

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
