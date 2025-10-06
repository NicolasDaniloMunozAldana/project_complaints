
require('dotenv').config();
const knex = require('../config/db');

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

exports.listComplaints = (req, res) => {
    knex('COMPLAINTS as c')
        .join('PUBLIC_ENTITYS as p', 'c.id_public_entity', 'p.id_public_entity')
        .select('c.id_complaint', 'p.name as public_entity', 'c.description', 'c.complaint_status', 'c.created_at')
        .where('c.status', 1)
        .orderBy('c.created_at', 'desc')
        .then((results) => {
            res.render('complaints_list', { complaints: results });
        })
        .catch(err => console.error(err));
};


// Importar constantes
const { PARSE_BASE } = require('../config/constants');

// Helper function para renderizar home con entidades y alert
const renderHomeWithAlert = (res, alert) => {
    return knex.select().from('PUBLIC_ENTITYS').then((results) => {
        res.render('home', {
            entitys: results,
            alert: alert
        });
    });
};

exports.fileComplaint = (req, res) => {
    const { entity, description } = req.body;
    if (!entity || !description || isNaN(Number(entity))) {
        return renderHomeWithAlert(res, {
            type: 'error',
            title: 'Error',
            message: 'Entity and description are required'
        });
    }
    knex('COMPLAINTS')
        .insert({
            id_public_entity: parseInt(entity, PARSE_BASE),
            description: description,
        })
        .then(() => {
            renderHomeWithAlert(res, {
                type: 'success',
                title: 'Éxito',
                message: 'Complaint successfully registered'
            });
        })
        .catch(err => {
            console.error(err);
            renderHomeWithAlert(res, {
                type: 'error',
                title: 'Error',
                message: 'Error saving complaint'
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

// Obtener comentarios anónimos de una queja específica
exports.getComments = (req, res) => {
    const { id_complaint } = req.params;
    
    if (!id_complaint || isNaN(Number(id_complaint))) {
        return res.status(400).json({ 
            success: false, 
            message: 'ID de queja inválido' 
        });
    }

    knex('ANONYMOUS_COMMENTS')
        .select('id_comment', 'comment_text', 'created_at')
        .where('id_complaint', id_complaint)
        .where('status', 1)
        .orderBy('created_at', 'desc')
        .then((comments) => {
            res.json({ 
                success: true, 
                comments: comments 
            });
        })
        .catch(err => {
            console.error('Error al obtener comentarios:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Error al obtener los comentarios' 
            });
        });
};

// Agregar comentario anónimo a una queja
exports.addComment = (req, res) => {
    const { id_complaint, comment_text } = req.body;
    
    // Validar datos requeridos
    if (!id_complaint || !comment_text) {
        return res.status(400).json({ 
            success: false, 
            message: 'ID de queja y texto del comentario son requeridos' 
        });
    }

    // Validar longitud mínima del comentario
    if (comment_text.trim().length < 10) {
        return res.status(400).json({ 
            success: false, 
            message: 'El comentario debe tener al menos 10 caracteres' 
        });
    }

    // Verificar que la queja existe y está activa
    knex('COMPLAINTS')
        .select('id_complaint')
        .where('id_complaint', id_complaint)
        .where('status', 1)
        .first()
        .then((complaint) => {
            if (!complaint) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Queja no encontrada o inactiva' 
                });
            }

            // Insertar el comentario
            return knex('ANONYMOUS_COMMENTS')
                .insert({
                    id_complaint: id_complaint,
                    comment_text: comment_text.trim()
                });
        })
        .then(() => {
            res.json({ 
                success: true, 
                message: 'Comentario agregado exitosamente' 
            });
        })
        .catch(err => {
            console.error('Error al agregar comentario:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Error al agregar el comentario' 
            });
        });
};

// Obtener detalles completos de una queja con sus comentarios
exports.getComplaintDetails = (req, res) => {
    const { id_complaint } = req.params;
    
    if (!id_complaint || isNaN(Number(id_complaint))) {
        return res.status(400).json({ 
            success: false, 
            message: 'ID de queja inválido' 
        });
    }

    Promise.all([
        // Obtener datos de la queja
        knex('COMPLAINTS as c')
            .join('PUBLIC_ENTITYS as p', 'c.id_public_entity', 'p.id_public_entity')
            .select('c.id_complaint', 'p.name as public_entity', 'c.description', 
                   'c.complaint_status', 'c.created_at', 'c.updated_at')
            .where('c.id_complaint', id_complaint)
            .where('c.status', 1)
            .first(),
        
        // Obtener comentarios de la queja
        knex('ANONYMOUS_COMMENTS')
            .select('id_comment', 'comment_text', 'created_at')
            .where('id_complaint', id_complaint)
            .where('status', 1)
            .orderBy('created_at', 'desc')
    ])
    .then(([complaint, comments]) => {
        if (!complaint) {
            return res.status(404).json({ 
                success: false, 
                message: 'Queja no encontrada' 
            });
        }

        res.json({ 
            success: true, 
            complaint: complaint,
            comments: comments 
        });
    })
    .catch(err => {
        console.error('Error al obtener detalles de la queja:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener los detalles de la queja' 
        });
    });
};
