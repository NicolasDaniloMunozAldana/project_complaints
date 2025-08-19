// Importación de dependencias principales
const express = require("express");
const path = require("path");
const axios = require("axios");
require('dotenv').config();

const app = express();

// Configurar directorio de vistas
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

// Middleware para procesar datos de formularios y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de conexión a la base de datos con Knex - COMPATIBLE CON SOCKET UNIX Y IP
const isSocketPath = process.env.DB_HOST && process.env.DB_HOST.startsWith('/cloudsql/');

const connectionConfig = isSocketPath ? {
  // Configuración para Cloud SQL Proxy (socket Unix)
  socketPath: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: 'Z',
  charset: 'utf8mb4'
} : {
  // Configuración para IP pública
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: 'Z',
  charset: 'utf8mb4'
};

const knex = require('knex')({
  client: 'mysql2',
  connection: connectionConfig,
  pool: {
    min: 1,
    max: 3, // Reducido para Cloud Run
    acquireTimeoutMillis: 60000, // 60 segundos
    createTimeoutMillis: 60000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
    propagateCreateError: false
  },
  debug: process.env.NODE_ENV === 'development',
  asyncStackTraces: process.env.NODE_ENV === 'development'
});

// Prueba de conexión inicial con mejor logging
knex.raw('SELECT 1 as test')
  .then((result) => {
    console.log(' Conexión exitosa a la base de datos MySQL');
    console.log(` Test query result: ${JSON.stringify(result[0])}`);
    console.log(` Connection type: ${isSocketPath ? 'Unix Socket' : 'TCP/IP'}`);
    console.log(` Connection path: ${process.env.DB_HOST}`);
  })
  .catch((err) => {
    console.error(' Error de conexión a la base de datos:', err.message);
    console.error(' Detalles del error:', {
      code: err.code,
      errno: err.errno,
      sqlMessage: err.sqlMessage,
      sqlState: err.sqlState,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      isSocketPath: isSocketPath
    });
  });

app.locals.knex = knex;

// ========================== RUTAS ==========================

// Health check para Cloud Run
app.get('/health', async (req, res) => {
  try {
    // Test simple de conexión con timeout más corto
    const testPromise = knex.raw('SELECT 1 as status');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 5000)
    );
    
    await Promise.race([testPromise, timeoutPromise]);
    
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'complaints-app',
      database: 'connected',
      pool: {
        used: knex.client.pool.numUsed(),
        free: knex.client.pool.numFree(),
        pending: knex.client.pool.numPendingAcquires(),
        size: knex.client.pool.size
      }
    });
  } catch (error) {
    console.error(' Health check failed:', error.message);
    res.status(503).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      service: 'complaints-app',
      database: 'disconnected',
      error: error.message,
      pool: knex.client.pool ? {
        used: knex.client.pool.numUsed(),
        free: knex.client.pool.numFree(),
        pending: knex.client.pool.numPendingAcquires(),
        size: knex.client.pool.size
      } : 'Pool not initialized'
    });
  }
});

// Ruta principal: muestra el home principal de la aplicación
app.get("/", async (req, res) => {
  let connection;
  try {
    console.log(' Intentando obtener entidades públicas...');
    console.log(` Pool status: used=${knex.client.pool.numUsed()}, free=${knex.client.pool.numFree()}`);
    
    // Usar timeout explícito para la query
    const results = await knex.select().from("PUBLIC_ENTITYS").timeout(10000);
    console.log(` Entidades obtenidas: ${results.length} registros`);
    res.render("home", { entitys: results });
  } catch (err) {
    console.error(' Error al obtener entidades:', err);
    console.error(' Error details:', {
      message: err.message,
      code: err.code,
      errno: err.errno
    });
    res.status(500).json({ 
      error: "Error al cargar las entidades",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Ruta para listar todas las quejas registradas junto con su entidad
app.get("/complaints/list", async (req, res) => {
  try {
    const results = await knex('COMPLAINTS as c')
      .join('PUBLIC_ENTITYS as p', 'c.id_public_entity', 'p.id_public_entity')
      .select('c.id_complaint', 'p.name as public_entity', 'c.description');
    
    res.render("complaints_list", { complaints: results });
  } catch (err) {
    console.error(' Error al listar quejas:', err);
    res.status(500).json({ 
      error: "Error al cargar las quejas",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Ruta para verificar el token de Google reCAPTCHA (v2)
app.post('/verify-captcha', async (req, res) => {
  try {
    const token = req.body.token;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token no enviado' });
    }

    const secretKey = process.env.RECAPTCHA_SECRET;
    if (!secretKey) {
      return res.status(500).json({ success: false, error: 'Configuración de reCAPTCHA faltante' });
    }

    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret: secretKey,
        response: token,
        remoteip: req.ip
      },
      timeout: 10000 // 10 segundos de timeout
    });

    const data = response.data;
    console.log(' Respuesta de Google reCAPTCHA v2:', data);

    if (data.success) {
      res.json({ success: true, message: 'Verificación exitosa' });
    } else {
      res.json({
        success: false,
        error: 'Verificación fallida',
        'error-codes': data['error-codes']
      });
    }
  } catch (err) {
    console.error(' Error en verify-captcha:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno en verify-captcha',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Ruta para registrar una nueva queja
app.post("/file", async (req, res) => {
  try {
    const { entity, description } = req.body;
    
    // Validación de entrada
    if (!entity || !description || isNaN(Number(entity))) {
      const results = await knex.select().from("PUBLIC_ENTITYS");
      return res.render("home", {
        entitys: results,
        alert: {
          type: 'error',
          title: 'Error',
          message: 'Entity and description are required'
        }
      });
    }

    // Inserción de la queja en la BD
    await knex("COMPLAINTS").insert({
      id_public_entity: parseInt(entity),
      description: description,
    });

    // Obtener entidades para mostrar en la vista
    const results = await knex.select().from("PUBLIC_ENTITYS");
    res.render("home", {
      entitys: results,
      alert: {
        type: 'success',
        title: 'Éxito',
        message: 'Complaint successfully registered'
      }
    });
  } catch (err) {
    console.error(' Error al guardar queja:', err);
    try {
      const results = await knex.select().from("PUBLIC_ENTITYS");
      res.render("home", {
        entitys: results,
        alert: {
          type: 'error',
          title: 'Error',
          message: 'Error saving complaint'
        }
      });
    } catch (innerErr) {
      console.error(' Error al obtener entidades:', innerErr);
      res.status(500).json({ 
        error: "Error al procesar la solicitud",
        details: process.env.NODE_ENV === 'development' ? innerErr.message : undefined
      });
    }
  }
});

// Ruta para estadísticas de quejas por entidad
app.get("/complaints/stats", async (req, res) => {
  try {
    const results = await knex('COMPLAINTS as c')
      .join('PUBLIC_ENTITYS as p', 'c.id_public_entity', 'p.id_public_entity')
      .select('p.name as public_entity')
      .count('c.id_complaint as total_complaints')
      .groupBy('p.id_public_entity', 'p.name')
      .orderBy('total_complaints', 'desc');
    
    res.render("complaints_stats", { stats: results });
  } catch (err) {
    console.error(' Error al obtener estadísticas:', err);
    res.status(500).json({ 
      error: "Error al obtener estadísticas",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: "Página no encontrada" });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error(' Error global:', err);
  res.status(500).json({ 
    error: "Error interno del servidor",
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Manejo del cierre de la aplicación
process.on('SIGINT', () => {
  console.log(' Cerrando conexiones de base de datos...');
  knex.destroy().then(() => {
    console.log(' Conexiones cerradas exitosamente');
    process.exit(0);
  }).catch((err) => {
    console.error(' Error al cerrar conexiones:', err);
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log(' SIGTERM recibido, cerrando aplicación...');
  knex.destroy().then(() => {
    console.log(' Conexiones cerradas exitosamente');
    process.exit(0);
  }).catch((err) => {
    console.error(' Error al cerrar conexiones:', err);
    process.exit(1);
  });
});

// Exportar la app (para testing)
module.exports = app;

// CONFIGURACIÓN PARA CLOUD RUN - PUERTO DINÁMICO
const PORT = process.env.PORT || 8080;

// Si se ejecuta directamente, iniciar el servidor
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(` Server started on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(` Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(` Health check: http://localhost:${PORT}/health`);
  });
}