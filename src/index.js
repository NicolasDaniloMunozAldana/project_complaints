// Cargar variables de entorno primero
require('dotenv').config();

// Importación de dependencias principales
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// (Knex removed, now using Sequelize models directly in repositories/services)

// Configuración del motor de vistas y carpeta de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rutas
const homeRoutes = require('./routes/homeRoutes');
const complaintsRoutes = require('./routes/complaintsRoutes');
const authRoutes = require('./routes/authRoutes');
const loginRoutes = require('./routes/loginRoutes');

app.use('/', homeRoutes);
app.use('/complaints', complaintsRoutes);
app.use('/auth', authRoutes);
app.use('/', loginRoutes);

// Importar constantes
const { DEFAULT_PORT } = require('./config/constants');

// Initialize Email Publisher Service (Kafka)
const EmailPublisherService = require('./services/EmailPublisherService');
let emailPublisherService = null;

/**
 * Initialize email publisher service
 */
async function initializeEmailPublisher() {
  try {
    if (process.env.KAFKA_ENABLED === 'true') {
      emailPublisherService = EmailPublisherService.getInstance();
      await emailPublisherService.initialize();
      console.log('[OK] Email Publisher Service initialized');
    } else {
      console.log(
        '[WARN] Kafka is disabled, email notifications will not be sent',
      );
    }
  } catch (error) {
    console.error(
      '[ERROR] Failed to initialize Email Publisher Service:',
      error.message,
    );
    console.log('[WARN] Continuing without email notifications...');
  }
}

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async () => {
  console.log('[INFO] Shutting down gracefully...');
  try {
    if (emailPublisherService) {
      await emailPublisherService.disconnect();
    }
    console.log('[OK] Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('[ERROR] Error during shutdown:', error.message);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Exportar la app (para testing con Jest o supertest)
module.exports = app;

// Si se ejecuta directamente, iniciar el servidor
if (require.main === module) {
  const PORT = process.env.PORT || DEFAULT_PORT;

  // Initialize email publisher before starting server
  initializeEmailPublisher()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`[OK] Server started on port ${PORT}`);
        console.log(
          `[INFO] Kafka Email Publisher: ${
            process.env.KAFKA_ENABLED === 'true' ? 'ENABLED' : 'DISABLED'
          }`,
        );
      });
    })
    .catch((error) => {
      console.error('[ERROR] Failed to start server:', error.message);
      console.error('[ERROR] Stack:', error.stack);
      process.exit(1);
    });
}
