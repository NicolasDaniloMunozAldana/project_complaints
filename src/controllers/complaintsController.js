
require('dotenv').config();
// Contraseña para borrar quejas: usa DELETE_PASSWORD, si no existe usa ADMIN_PASSWORD, si no existe usa 'admin123'
const DELETE_PASSWORD = process.env.DELETE_PASSWORD || process.env.ADMIN_PASSWORD || 'admin123';

// Eliminar queja con validación de contraseña
exports.deleteComplaint = (req, res) => {
    const { id_complaint, password } = req.body;
    if (!id_complaint || !password) {
        return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }
    if (password !== DELETE_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }
    knex('COMPLAINTS')
        .where('id_complaint', id_complaint)
        .update({ status: 0 })
        .then(count => {
            if (count > 0) {
                res.json({ success: true });
            } else {
                res.status(404).json({ success: false, message: 'Queja no encontrada' });
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ success: false, message: 'Error al borrar la queja' });
        });
};
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
