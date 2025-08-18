// Importación de dependencias principales
let express = require("express");
let app = express();
let path = require("path");
let axios = require("axios");  // Usado para hacer peticiones HTTP (ej: a Google reCAPTCHA) 

// Configuración del motor de plantillas
app.set("view engine", "ejs");

// Middleware para procesar datos de formularios y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de conexión a la base de datos con Knex
const knex = require('knex')({
    client: 'mysql2',
    connection: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'nicolas2004',
        database: 'dbcomplaints',
    },
});



// ========================== RUTAS ==========================

// Ruta principal: muestra el home principal de la aplicación y el redireccionamiento a las demás rutas (Radicar Quejas, Listar Quejas...)
app.get("/", (req, res) => {
    knex.select().from("PUBLIC_ENTITYS").then((results) => {
        res.render("home", { entitys: results });
    });
});

// Ruta para listar todas las quejas registradas junto con su entidad
app.get("/complaints/list", (req, res) => {
    knex('COMPLAINTS as c')
      .join('PUBLIC_ENTITYS as p', 'c.id_public_entity', 'p.id_public_entity')
      .select('c.id_complaint', 'p.name as public_entity', 'c.description')
      .then((results) => {
          res.render("complaints_list", { complaints: results });
      })
      .catch(err => console.error(err));
});

// Ruta para verificar el token de Google reCAPTCHA (v2)
app.post('/verify-captcha', async (req, res) => {
  try {
    const token = req.body.token;

        // Si no se envía token da error inmediato.
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token no enviado' });
    }

    const secretKey = "6Le9BKkrAAAAAJmcLj6EBV5IAUdIFYmh9qs3TSqH"; 
    
        // Envío de la validación a Google
    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret: secretKey,
        response: token,
        remoteip: req.ip
      }
    });

    const data = response.data;
    
    console.log('Respuesta de Google reCAPTCHA v2:', data);

    if (data.success) {
              // Validación exitosa, significa que el usuario es humano.

      res.json({ success: true, message: 'Verificación exitosa' });
    } else {
              // Validación fallida, significa que posiblemente el usuario es un bot.

      res.json({ 
        success: false, 
        error: 'Verificación fallida',
        'error-codes': data['error-codes'] 
      });
    }
    
  } catch (err) {
    console.error('Error en verify-captcha:', err);
    res.status(500).json({ success: false, error: 'Error interno en verify-captcha' });
  }
});

// Ruta para registrar una nueva queja
app.post("/file", (req, res) => {
    const { entity, description } = req.body;
    if (!entity || !description || isNaN(Number(entity))) {
        return knex.select().from("PUBLIC_ENTITYS").then((results) => {
            res.render("home", { 
                entitys: results,
                alert: {
                    type: 'error',
                    title: 'Error',
                    message: 'Entity and description are required'
                }
            });
        });
    }

        // Inserción de la queja en la BD
    knex("COMPLAINTS")
        .insert({
            id_public_entity: parseInt(entity),
            description: description,
        })
        .then(() => {
            knex.select().from("PUBLIC_ENTITYS").then((results) => {
                res.render("home", { 
                    entitys: results,
                    alert: {
                        type: 'success',
                        title: 'Éxito',
                        message: 'Complaint successfully registered'
                    }
                });
            });
        })
        .catch(err => {
            console.error(err);
            knex.select().from("PUBLIC_ENTITYS").then((results) => {
                res.render("home", { 
                    entitys: results,
                    alert: {
                        type: 'error',
                        title: 'Error',
                        message: 'Error saving complaint'
                    }
                });
            });
        });
});

// Exportar la app (para testing con Jest o supertest)

module.exports = app;

// Si se ejecuta directamente, iniciar el servidor
if (require.main === module) {
    app.listen(3030, () => console.log("Server started in port 3030"));
}
