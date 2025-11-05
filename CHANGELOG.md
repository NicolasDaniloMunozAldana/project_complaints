# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.4] - 2025-11-05

### Removed
- **reCAPTCHA Verification System**
  - Removed Google reCAPTCHA v2 integration from complaints list view
  - Removed `/verify-captcha` POST endpoint from server
  - Removed `RECAPTCHA_SECRET` environment variable from configuration
  - Removed captcha HTML container, wrapper, and message components
  - Removed captcha verification JavaScript logic and callbacks
  - Removed `onCaptchaSuccess()` callback function
  - Removed `isCaptchaValid()` validation function
  - Removed `adjustRecaptcha()` responsive adjustment function
  - Removed captcha-related event listeners (DOMContentLoaded, resize, load)
  - Removed captcha localStorage management (token and expiration)
  - Removed all captcha-related CSS styles and media query adjustments
  - Removed Google reCAPTCHA API script from page head
  - Simplified `showComplaintsList()` function by removing captcha checks

### Changed
- **Complaints List Access**
  - Complaints list now displays immediately without captcha verification
  - Removed display:none styling from complaints container
  - Streamlined user experience with direct access to complaints

## [0.0.3] - 2025-10-22

### Added
- **UI Improvements**
  - Dropdown menu for complaint actions (view comments, change status, delete) for cleaner interface
  - Entity filter dropdown in complaints list view for easier filtering

- **Authentication System Integration**
  - Integration with external authentication microservice
  - Login/logout functionality with session management
  - Session validation for protected routes
  - Username persistence in localStorage
  - Login and logout buttons in navigation bar across all pages
  - Session verification UI with redirect to login when session is inactive
  - Protected complaint operations (delete and status change) requiring active session
  
- **User Management**
  - USERS table with migration support
  - User model with Sequelize associations
  - Session status tracking for users

- **UI Enhancements**
  - Login form with authentication flow
  - Session state display showing logged-in username
  - Redirect handling after successful login
  - No-session message when accessing protected pages without authentication

### Changed
- **Database Migration to Sequelize ORM**
  - Migrated from Knex.js to Sequelize ORM
  - Created Sequelize models for Complaint, Comment, Entity, and User
  - Implemented model associations and relationships
  - Added database migrations for all tables
  - Updated repositories to use Sequelize queries

- **Architecture Improvements**
  - Implemented layered architecture (MVC + Service + Repository)
  - Created separate repositories for complaints, comments, and entities
  - Refactored complaint service with business logic separation
  - Added validators for input validation
  - Improved error handling across all layers

- **Complaint Management Enhancements**
  - Removed hardcoded admin password requirement
  - Updated delete and status change operations to validate user session instead of password
  - Enhanced complaint operations to include username tracking

### Fixed
- Corrected table name from 'PUBLIC_ENTITYS' to 'PUBLIC_ENTITIES' in migrations and models
- Fixed session_status field definition in User model
- Fixed complaint service import path
- Updated tests to match new database structure and architecture
- Resolved security vulnerabilities by updating axios to 1.12.2 and nodemailer to 7.0.9
- Fixed search functionality in complaints statistics table (disabled to improve performance)

### Security
- Removed hardcoded default admin password
- Implemented session-based authentication replacing password-based operations
- Added session validation for sensitive operations

## [0.0.2] - 2025-09-24

### Added
- **Anonymous Comments System**
  - ANONYMOUS_COMMENTS table with timestamps
  - Comment creation and listing functionality
  - Anonymous comment interface in complaint details modal
  - Comment validation (minimum 10 characters)
  - Display of comment creation dates

- **Complaint Status Management**
  - Status field for complaints (abierta, en_revision, cerrada)
  - Status update functionality for authorized users
  - Visual status badges with color coding
  - Status change modal with dropdown selector

- **Complaint Deletion**
  - Soft delete functionality using status column
  - Admin password protection for deletions
  - Confirmation dialog before deletion
  - Updated query filters to show only active complaints

- **Configuration Management**
  - Constants file to eliminate magic numbers
  - Centralized configuration for application settings
  - Environment variable for admin password

- **reCAPTCHA Enhancement**
  - Token persistence in localStorage
  - 30-minute token expiration
  - Automatic captcha bypass for valid tokens
  - Reduced friction for returning users

### Changed
- **Email Architecture Refactor**
  - Implemented decoupled architecture with Factory and Singleton patterns
  - Created IEmailService interface for extensibility
  - Implemented GmailEmailService with credential validation
  - Added backward compatibility layer
  - Comprehensive documentation in EMAIL_ARCHITECTURE.md

- **Project Structure**
  - Reorganized file structure following MVC pattern
  - Separated controllers, routes, and views
  - Improved code organization and maintainability

- **Documentation**
  - Updated README to English
  - Added naming conventions for issues, branches, and PRs (KAN-XX format)
  - Added pull request description structure guidelines
  - Documented new features and architecture changes

- **Testing**
  - Added ESLint check to GitHub Actions workflow
  - Enhanced test coverage for complaints and comments
  - Added validation for creation dates in tests
  - Removed integration tests in favor of unit tests

### Fixed
- Knex import order in complaintsController
- Code duplication in file complaint rendering
- Stats page accessibility and structure improvements
- Mobile responsive design issues
- Table header alignment and column proportions
- Various UI/UX improvements

## [0.0.1] - 2025-08-19

### Added
- **Initial Release**
  - Express.js server with basic routing
  - MySQL database integration with Knex.js
  - EJS templating engine setup

- **Complaint Management**
  - Create new complaints with entity and description
  - List all complaints in a paginated table
  - Complaint form validation
  - reCAPTCHA v2 integration for bot protection

- **Statistics and Reports**
  - Complaint statistics dashboard
  - Data aggregation by entity
  - Visual reports with charts
  - Export functionality

- **User Interface**
  - Responsive design for mobile and desktop
  - Bootstrap 5 integration
  - DataTables for enhanced table functionality
  - Home page with navigation
  - Complaint list view with pagination
  - Statistics view with visual charts

- **Testing and CI/CD**
  - Jest test framework setup
  - Supertest for API testing
  - GitHub Actions workflow for continuous integration
  - Basic unit tests for complaint operations
  - Mock database for testing

- **Project Infrastructure**
  - .gitignore configuration
  - .env for environment variables
  - README with installation instructions
  - Project structure organization

### Security
- reCAPTCHA v2 for form protection
- Environment variable management for sensitive data
- Input validation and sanitization

---

## Version History Summary

- **[0.0.3]** - Authentication system, Sequelize ORM migration, layered architecture
- **[0.0.2]** - Comments, status management, deletion, email refactor, reCAPTCHA enhancement
- **[0.0.1]** - Initial release with basic complaint management, statistics, and testing
