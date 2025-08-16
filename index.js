let express = require("express");
let app = express();
let axios = require("axios"); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.set("view engine", "ejs");

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

app.get("/home", (req, res) => {
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

app.post('/verify-captcha', async (req, res) => {
  try {
    const token = req.body.token;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token no enviado' });
    }

    const secretKey = "6Ld0TagrAAAAALCV5YxjmWEkppHaKN83Ab3kIXpK"; 
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();

    console.log('Respuesta de Google:', data); 

    res.json(data); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error interno en verify-captcha' });
  }
});



app.listen(3030);