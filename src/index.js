let express = require("express");
let app = express();
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
        password: 'nicolas2004',
        database: 'dbcomplaints',
    },
});

app.get("/", (req, res) => {
    knex.select().from("PUBLIC_ENTITYS").then((results) => {
        res.render("home", { entitys: results });
    });
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