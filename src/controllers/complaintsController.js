
require('dotenv').config();

const DELETE_PASSWORD = process.env.ADMIN_PASSWORD;

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
        .select('c.id_complaint', 'p.name as public_entity', 'c.description', 'c.complaint_status')
        .where('c.status', 1)
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
    Promise.all([
        // Estadísticas por entidad
        knex('COMPLAINTS as c')
            .join('PUBLIC_ENTITYS as p', 'c.id_public_entity', 'p.id_public_entity')
            .select('p.name as public_entity')
            .count('c.id_complaint as total_complaints')
            .where('c.status', 1)
            .groupBy('p.id_public_entity', 'p.name')
            .orderBy('total_complaints', 'desc'),
        
        // Estadísticas por estado de queja
        knex('COMPLAINTS')
            .select('complaint_status')
            .count('id_complaint as total')
            .where('status', 1)
            .groupBy('complaint_status')
    ])
    .then(([entityStats, statusStats]) => {
        res.render('complaints_stats', { 
            stats: entityStats,
            statusStats: statusStats
        });
    })
    .catch(err => {
        console.error(err);
        res.status(500).send('Error al obtener estadísticas');
    });
};

// Cambiar estado de queja con validación de contraseña
exports.updateComplaintStatus = (req, res) => {
    const { id_complaint, complaint_status, password } = req.body;
    
    // Validar datos requeridos
    if (!id_complaint || !complaint_status || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Datos incompletos: se requiere ID de queja, nuevo estado y contraseña' 
        });
    }

    // Validar estados permitidos
    const allowedStatuses = ['abierta', 'en_revision', 'cerrada'];
    if (!allowedStatuses.includes(complaint_status)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Estado no válido. Los estados permitidos son: abierta, en_revision, cerrada' 
        });
    }

    // Validar contraseña
    if (password !== DELETE_PASSWORD) {
        return res.status(401).json({ 
            success: false, 
            message: 'Contraseña incorrecta' 
        });
    }

    // Actualizar el estado de la queja
    knex('COMPLAINTS')
        .where('id_complaint', id_complaint)
        .update({ complaint_status: complaint_status })
        .then(count => {
            if (count > 0) {
                res.json({ 
                    success: true, 
                    message: `Estado de la queja actualizado a: ${complaint_status}` 
                });
            } else {
                res.status(404).json({ 
                    success: false, 
                    message: 'Queja no encontrada' 
                });
            }
        })
        .catch(err => {
            console.error('Error al actualizar estado de queja:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Error al actualizar el estado de la queja' 
            });
        });
};
