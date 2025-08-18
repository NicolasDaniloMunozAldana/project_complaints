let express = require("express");
let app = express();
let axios = require("axios"); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

let path = require("path");


app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const knex = require('knex')({
    client: 'mysql2',
    connection: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'root123',
        database: 'dbcomplaints',
    },
});

app.get("/", (req, res) => {
    knex.select().from("PUBLIC_ENTITYS").then((results) => {
        res.render("home", { entitys: results });
    });
});

app.get("/complaints/list", (req, res) => {
    knex('COMPLAINTS as c')
      .join('PUBLIC_ENTITYS as p', 'c.id_public_entity', 'p.id_public_entity')
      .select('c.id_complaint', 'p.name as public_entity', 'c.description')
      .then((results) => {
          res.render("complaints_list", { complaints: results });
      })
      .catch(err => console.error(err));
});

// Nueva ruta para estadísticas de quejas por entidad
app.get("/complaints/stats", (req, res) => {
    knex('COMPLAINTS as c')
      .join('PUBLIC_ENTITYS as p', 'c.id_public_entity', 'p.id_public_entity')
      .select('p.name as public_entity')
      .count('c.id_complaint as total_complaints')
      .groupBy('p.id_public_entity', 'p.name')
      .orderBy('total_complaints', 'desc')
      .then((results) => {
          res.render("complaints_stats", { stats: results });
      })
      .catch(err => {
          console.error(err);
          res.status(500).send('Error al obtener estadísticas');
      });
});

app.get("/complaints/stats", (req, res) => {
    knex('COMPLAINTS as c')
      .join('PUBLIC_ENTITYS as p', 'c.id_public_entity', 'p.id_public_entity')
      .select('p.name as public_entity')
      .count('c.id_complaint as total_complaints')
      .groupBy('p.id_public_entity', 'p.name')
      .orderBy('total_complaints', 'desc')
      .then((results) => {
          res.render("complaints_stats", { stats: results });
      })
      .catch(err => {
          console.error(err);
          res.status(500).send('Error al obtener estadísticas');
      });
});

app.post('/verify-captcha', async (req, res) => {
  try {
    const token = req.body.token;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token no enviado' });
    }

    const secretKey = "6Le9BKkrAAAAAJmcLj6EBV5IAUdIFYmh9qs3TSqH"; 
    
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
      res.json({ success: true, message: 'Verificación exitosa' });
    } else {
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

module.exports = app;

if (require.main === module) {
    app.listen(3030, () => console.log("Server started in port 3030"));
}
