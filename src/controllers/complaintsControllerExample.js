const { logEvent, logError } = require('../utils/logger');
const complaintsService = require('../services/complaintService');
const ComplaintEventRepository = require('../repositories/complaintEventRepository');
const { EmailProducer } = require('../services/emailQueueService');

/**
 * Ejemplo de controlador con logging completo y comunicación con microservicios
 */
exports.updateComplaintStatusWithLogging = async (req, res) => {
    const correlationId = req.correlationId; // Obtenido del middleware
    const { id_complaint, complaint_status, password } = req.body;

    try {
        // Log del inicio de la operación
        logEvent(
            'UPDATE_COMPLAINT_STATUS_STARTED',
            {
                complaintId: id_complaint,
                newStatus: complaint_status
            },
            correlationId
        );

        // Obtener estado actual antes del cambio
        const currentComplaint = await complaintsService.getComplaintById(id_complaint);
        const oldStatus = currentComplaint.complaint_status;

        // Actualizar el estado en este microservicio
        const result = await complaintsService.updateComplaintStatus(
            id_complaint,
            complaint_status,
            password
        );

        if (result.success) {
            // Enviar evento al microservicio de Event Sourcing (async, no bloqueante)
            const eventRepo = new ComplaintEventRepository();
            eventRepo.saveEvent({
                complaintId: id_complaint,
                oldStatus: oldStatus,
                newStatus: complaint_status,
                changedBy: 'admin', // o req.user.id si tienes auth
                reason: 'Status updated via API'
            }, correlationId).catch(error => {
                // Solo loguear si falla, no detener la operación principal
                logError(error, { 
                    operation: 'saveEventAsync',
                    complaintId: id_complaint 
                }, correlationId);
            });

            // Enviar notificación por email al microservicio (async, no bloqueante)
            const emailProducer = new EmailProducer();
            emailProducer.produceEmailMessage({
                to: 'admin@example.com',
                subject: 'Complaint Status Changed',
                template: 'status-change',
                data: {
                    complaintId: id_complaint,
                    oldStatus,
                    newStatus: complaint_status
                }
            }, correlationId).catch(error => {
                // Solo loguear si falla, no detener la operación principal
                logError(error, { 
                    operation: 'sendEmailAsync',
                    complaintId: id_complaint 
                }, correlationId);
            });

            // Log de éxito
            logEvent(
                'UPDATE_COMPLAINT_STATUS_SUCCESS',
                {
                    complaintId: id_complaint,
                    oldStatus,
                    newStatus: complaint_status
                },
                correlationId
            );

            res.status(200).json({
                success: true,
                message: result.message,
                correlationId // Devolver correlation ID al cliente
            });
        } else {
            logEvent(
                'UPDATE_COMPLAINT_STATUS_FAILED',
                {
                    complaintId: id_complaint,
                    reason: result.message
                },
                correlationId
            );

            res.status(result.statusCode).json({
                success: false,
                message: result.message,
                correlationId
            });
        }
    } catch (error) {
        logError(
            error,
            {
                controller: 'complaintsController',
                action: 'updateComplaintStatusWithLogging',
                complaintId: id_complaint
            },
            correlationId
        );

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            correlationId
        });
    }
};
