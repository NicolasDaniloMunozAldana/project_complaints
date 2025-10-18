
const complaintsService = require('../services/complaintService');

/**
 * Helper function para renderizar home con entidades y alert
 * @param {Object} res - Response object
 * @param {Object} alert - Alert object
 */
const renderHomeWithAlert = async (res, alert) => {
    try {
        const entitiesResult = await complaintsService.getAllEntities();
        
        if (entitiesResult.success) {
            res.render('home', {
                entitys: entitiesResult.data,
                alert: alert
            });
        } else {
            res.status(entitiesResult.statusCode).render('error', {
                message: entitiesResult.message
            });
        }
    } catch (error) {
        console.error('Error rendering home:', error);
        res.status(500).render('error', {
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Listar todas las quejas activas
 */
exports.listComplaints = async (req, res) => {
    try {
        const result = await complaintsService.getAllComplaints();
        
        if (result.success) {
            res.render('complaints_list', { complaints: result.data });
        } else {
            res.status(result.statusCode).render('error', {
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error in listComplaints controller:', error);
        res.status(500).render('error', {
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Crear una nueva queja
 */
exports.fileComplaint = async (req, res) => {
    try {
        const { entity, description } = req.body;
        
        const result = await complaintsService.createComplaint(entity, description);
        
        if (result.success) {
            await renderHomeWithAlert(res, {
                type: 'success',
                title: 'Éxito',
                message: result.message
            });
        } else {
            await renderHomeWithAlert(res, {
                type: 'error',
                title: 'Error',
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error in fileComplaint controller:', error);
        await renderHomeWithAlert(res, {
            type: 'error',
            title: 'Error',
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Eliminar una queja (soft delete)
 */
exports.deleteComplaint = async (req, res) => {
    try {
        const { id_complaint, username} = req.body;
        
        const result = await complaintsService.deleteComplaint(id_complaint, username);
        
        if (result.statusCode === 401) {
            // Sesión inactiva, redirigir al login
            return res.status(401).json({
                success: false,
                message: result.message,
                redirectToLogin: true
            });
        }
        
        res.status(result.statusCode).json({
            success: result.success,
            message: result.message
        });
    } catch (error) {
        console.error('Error in deleteComplaint controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Obtener estadísticas de quejas
 */
exports.complaintsStats = async (req, res) => {
    try {
        const result = await complaintsService.getComplaintsStats();
        
        if (result.success) {
            res.render('complaints_stats', { 
                stats: result.data.entityStats,
                statusStats: result.data.statusStats
            });
        } else {
            res.status(result.statusCode).render('error', {
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error in complaintsStats controller:', error);
        res.status(500).render('error', {
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Actualizar el estado de una queja
 */
exports.updateComplaintStatus = async (req, res) => {
    try {        
        const { id_complaint, complaint_status, username} = req.body;
                

        const result = await complaintsService.updateComplaintStatus(id_complaint, complaint_status, username);
                
        if (result.statusCode === 401) {
            // Sesión inactiva, redirigir al login
            return res.status(401).json({
                success: false,
                message: result.message,
                redirectToLogin: true
            });
        }
        
        res.status(result.statusCode).json({
            success: result.success,
            message: result.message
        });
    } catch (error) {
        console.error('Error in updateComplaintStatus controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Obtener comentarios de una queja específica
 */
exports.getComments = async (req, res) => {
    try {
        const { id_complaint } = req.params;
        
        const result = await complaintsService.getComments(id_complaint);
        
        res.status(result.statusCode).json({
            success: result.success,
            comments: result.data || [],
            message: result.message
        });
    } catch (error) {
        console.error('Error in getComments controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Agregar comentario anónimo a una queja
 */
exports.addComment = async (req, res) => {
    try {
        const { id_complaint, comment_text } = req.body;
        
        const result = await complaintsService.addComment(id_complaint, comment_text);
        
        res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    } catch (error) {
        console.error('Error in addComment controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Obtener detalles completos de una queja con sus comentarios
 */
exports.getComplaintDetails = async (req, res) => {
    try {
        const { id_complaint } = req.params;
        
        const result = await complaintsService.getComplaintDetails(id_complaint);
        
        res.status(result.statusCode).json({
            success: result.success,
            complaint: result.data?.complaint || null,
            comments: result.data?.comments || [],
            message: result.message
        });
    } catch (error) {
        console.error('Error in getComplaintDetails controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};