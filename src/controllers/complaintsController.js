
const complaintsService = require('../services/complaintService');
const EmailPublisherService = require('../services/EmailPublisherService');

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
        console.error('[ERROR] Error rendering home:', error.message);
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
            // Enviar notificación por email cuando se acceda a la lista de quejas
            try {
                const emailPublisher = EmailPublisherService.getInstance();
                
                // Obtener destinatarios desde variables de entorno
                const recipients = process.env.EMAIL_RECIPIENTS 
                    ? process.env.EMAIL_RECIPIENTS.split(',').map(email => email.trim())
                    : [process.env.EMAIL_USER];

                const ccRecipients = process.env.EMAIL_CC_RECIPIENTS
                    ? process.env.EMAIL_CC_RECIPIENTS.split(',').map(email => email.trim())
                    : [];

                // Preparar el contenido del email con información de las quejas
                const totalComplaints = result.data.length;
                const complaintsByStatus = result.data.reduce((acc, complaint) => {
                    acc[complaint.complaint_status] = (acc[complaint.complaint_status] || 0) + 1;
                    return acc;
                }, {});

                const statsHtml = `
                    <h2>Acceso a Lista de Quejas</h2>
                    <p>Se ha accedido a la página de lista de quejas del sistema.</p>
                    <p><strong>Fecha y hora:</strong> ${new Date().toLocaleString('es-ES')}</p>
                    <h3>Resumen:</h3>
                    <ul>
                        <li><strong>Total de quejas activas:</strong> ${totalComplaints}</li>
                        ${Object.entries(complaintsByStatus).map(([status, count]) => 
                            `<li><strong>${status}:</strong> ${count}</li>`
                        ).join('')}
                    </ul>
                    <h3>Últimas 5 quejas:</h3>
                    <ul>
                        ${result.data.slice(0, 5).map(complaint => 
                            `<li><strong>#${complaint.id_complaint}</strong> - ${complaint.public_entity_name} (${complaint.complaint_status})</li>`
                        ).join('')}
                    </ul>
                `;

                await emailPublisher.publishCustomNotification({
                    id: `list-access-${Date.now()}`,
                    to: recipients,
                    cc: ccRecipients,
                    subject: `📋 Acceso a Lista de Quejas - ${new Date().toLocaleDateString('es-ES')}`,
                    title: 'Notificación de Acceso a Lista de Quejas',
                    html: statsHtml,
                    priority: 'normal',
                    metadata: {
                        eventType: 'LIST_ACCESS',
                        source: 'complaints-service',
                        timestamp: new Date().toISOString()
                    }
                });

                console.log('[OK] Email notification sent for complaints list page access');
            } catch (emailError) {
                // No fallar si el email falla, solo registrar el error
                console.error('[WARN] Failed to send list access email:', emailError.message);
            }

            res.render('complaints_list', { complaints: result.data });
        } else {
            res.status(result.statusCode).render('error', {
                message: result.message
            });
        }
    } catch (error) {
        console.error('[ERROR] Error in listComplaints controller:', error.message);
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
        console.error('[ERROR] Error in fileComplaint controller:', error.message);
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
        console.error('[ERROR] Error in deleteComplaint controller:', error.message);
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
