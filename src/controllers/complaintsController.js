const knex = require('../config/db');

exports.listComplaints = (req, res) => {
    knex('COMPLAINTS as c')
        .join('PUBLIC_ENTITYS as p', 'c.id_public_entity', 'p.id_public_entity')
        .select('c.id_complaint', 'p.name as public_entity', 'c.description')
        .then((results) => {
            res.render('complaints_list', { complaints: results });
        })
        .catch(err => console.error(err));
};


// Importar constantes
const { PARSE_BASE } = require('../config/constants');

exports.fileComplaint = (req, res) => {
    const { entity, description } = req.body;
    if (!entity || !description || isNaN(Number(entity))) {
        return knex.select().from('PUBLIC_ENTITYS').then((results) => {
            res.render('home', {
                entitys: results,
                alert: {
                    type: 'error',
                    title: 'Error',
                    message: 'Entity and description are required'
                }
            });
        });
    }
    knex('COMPLAINTS')
        .insert({
            id_public_entity: parseInt(entity, PARSE_BASE),
            description: description,
        })
        .then(() => {
            knex.select().from('PUBLIC_ENTITYS').then((results) => {
                res.render('home', {
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
            knex.select().from('PUBLIC_ENTITYS').then((results) => {
                res.render('home', {
                    entitys: results,
                    alert: {
                        type: 'error',
                        title: 'Error',
                        message: 'Error saving complaint'
                    }
                });
            });
        });
};

exports.complaintsStats = (req, res) => {
    knex('COMPLAINTS as c')
        .join('PUBLIC_ENTITYS as p', 'c.id_public_entity', 'p.id_public_entity')
        .select('p.name as public_entity')
        .count('c.id_complaint as total_complaints')
        .groupBy('p.id_public_entity', 'p.name')
        .orderBy('total_complaints', 'desc')
        .then((results) => {
            res.render('complaints_stats', { stats: results });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error al obtener estadísticas');
        });
};
