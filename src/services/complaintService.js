const complaintsRepository = require('../repositories/complaintsRepository');
const entitiesRepository = require('../repositories/entitiesRepository');
const commentsRepository = require('../repositories/commentsRepository');
const complaintsValidator = require('../validators/complaintsValidator');
const authService = require('./authService');
const EmailPublisherService = require('./EmailPublisherService');
const { getPublisherInstance } = require('./ComplaintStatusEventPublisher');
const {
  getEmailRecipientsFromEnv,
  prepareComplaintData,
} = require('../utils/emailHelpers');
const { logBusinessEvent, logError, logDatabaseOperation } = require('../utils/logger');

class ComplaintsService {
    /**
     * Crear una nueva queja
     * @param {string|number} entity - ID de la entidad
     * @param {string} description - Descripción de la queja
     * @param {string} correlationId - ID de correlación para trazabilidad
     * @returns {Promise<Object>} Resultado de la operación
     */
    async createComplaint(entity, description, correlationId = null) {
        try {
            logBusinessEvent('COMPLAINT_CREATE_STARTED', {
                entity,
                descriptionLength: description?.length || 0
            }, correlationId);

            // Validar datos de entrada
            const validation = complaintsValidator.validateComplaintData(entity, description);
            if (!validation.isValid) {
                logBusinessEvent('COMPLAINT_CREATE_VALIDATION_FAILED', {
                    reason: validation.message
                }, correlationId);
                return {
                    success: false,
                    message: validation.message,
                    statusCode: validation.statusCode
                };
            }

            // Verificar que la entidad existe
            const entityExists = await entitiesRepository.exists(validation.data.id_public_entity);
            if (!entityExists) {
                logBusinessEvent('COMPLAINT_CREATE_ENTITY_NOT_FOUND', {
                    entityId: validation.data.id_public_entity
                }, correlationId);
                return {
                    success: false,
                    message: 'La entidad pública especificada no existe',
                    statusCode: 400
                };
            }

            // Crear la queja
            const complaintId = await complaintsRepository.create(validation.data);
            logDatabaseOperation('INSERT', 'complaints', { complaintId }, correlationId);
            logBusinessEvent('COMPLAINT_CREATED', {
                complaintId,
                entityId: validation.data.id_public_entity,
                status: 'abierta'
            }, correlationId);

            // Obtener datos completos de la queja para el email
            const complaint = await complaintsRepository.findById(complaintId);

            // Publicar evento de creación de queja (Event Sourcing)
            if (process.env.KAFKA_ENABLED === 'true') {
                this._publishStatusChangeEvent(
                    complaintId,
                    null,
                    'abierta',
                    'system',
                    'Queja creada',
                    correlationId
                ).catch(error => {
                    logError(error, { operation: 'publishStatusChangeEvent', complaintId }, correlationId);
                });
            }

            // Enviar notificación por email (asíncrono, no bloquea la respuesta)
            if (complaint && process.env.KAFKA_ENABLED === 'true') {
                this._sendComplaintNotificationEmail(complaint, correlationId).catch(error => {
                    logError(error, { operation: 'sendComplaintNotificationEmail', complaintId }, correlationId);
                });
            }

            logBusinessEvent('COMPLAINT_CREATE_SUCCESS', {
                complaintId
            }, correlationId);

            return {
                success: true,
                message: 'Queja registrada exitosamente',
                statusCode: 201,
                data: { id_complaint: complaintId }
            };
        } catch (error) {
            logError(error, { operation: 'createComplaint', entity, description }, correlationId);
            return {
                success: false,
                message: 'Error interno al crear la queja',
                statusCode: 500
            };
        }
    }

    /**
     * Obtener todas las quejas activas
     * @returns {Promise<Object>} Resultado de la operación
     */
    async getAllComplaints() {
        try {
            const complaints = await complaintsRepository.findAllActive();
            // Mapear para aplanar el nombre de la entidad
            const mappedComplaints = complaints.map(c => ({
                id_complaint: c.id_complaint,
                description: c.description,
                complaint_status: c.complaint_status,
                created_at: c.created_at,
                public_entity: c.Entity ? c.Entity.name : '',
            }));
            return {
                success: true,
                data: mappedComplaints,
                statusCode: 200
            };
        } catch (error) {
            console.error('[ERROR] Error fetching complaints:', error.message);
            return {
                success: false,
                message: 'Error al obtener las quejas',
                statusCode: 500
            };
        }
    }

    /**
     * Eliminar una queja (soft delete)
     * @param {string|number} id_complaint - ID de la queja
     * @param {string} username - Nombre del usuario que realiza la acción
     * @returns {Promise<Object>} Resultado de la operación
     */
    async deleteComplaint(id_complaint, username) {
        try {
            // Validar ID de queja
            const idValidation = complaintsValidator.validateComplaintId(id_complaint);
            if (!idValidation.isValid) {
                return {
                    success: false,
                    message: idValidation.message,
                    statusCode: idValidation.statusCode
                };
            }

            if (!username) {
                return {
                    success: false,
                    message: 'Se requiere un usuario con sesión activa para realizar esta acción',
                    statusCode: 400
                };
            }

            // Validar sesión activa del usuario
            const sessionValidation = await authService.validateSession(username);
            if (!sessionValidation.success || !sessionValidation.data?.isActive) {
                return {
                    success: false,
                    message: 'Sesión inactiva. Por favor, inicie sesión nuevamente.',
                    statusCode: 401
                };
            }

            // Eliminar la queja
            const wasDeleted = await complaintsRepository.softDelete(idValidation.data);

            if (wasDeleted) {
                return {
                    success: true,
                    message: 'Queja eliminada exitosamente',
                    statusCode: 200
                };
            } else {
                return {
                    success: false,
                    message: 'Queja no encontrada',
                    statusCode: 404
                };
            }
        } catch (error) {
            console.error('[ERROR] Error deleting complaint:', error.message);
            return {
                success: false,
                message: 'Error interno al eliminar la queja',
                statusCode: 500
            };
        }
    }

    /**
     * Actualizar el estado de una queja
     * @param {string|number} id_complaint - ID de la queja
     * @param {string} complaint_status - Nuevo estado
     * @param {string} username - Nombre del usuario que realiza la acción
     * @param {string} correlationId - ID de correlación para trazabilidad
     * @returns {Promise<Object>} Resultado de la operación
     */
    async updateComplaintStatus(id_complaint, complaint_status, username, correlationId = null) {
        try {
            logBusinessEvent('COMPLAINT_STATUS_UPDATE_STARTED', {
                complaintId: id_complaint,
                newStatus: complaint_status,
                username
            }, correlationId);

            // Validar ID de queja
            const idValidation = complaintsValidator.validateComplaintId(id_complaint);
            if (!idValidation.isValid) {
                logBusinessEvent('COMPLAINT_STATUS_UPDATE_VALIDATION_FAILED', {
                    reason: idValidation.message,
                    complaintId: id_complaint
                }, correlationId);
                return {
                    success: false,
                    message: idValidation.message,
                    statusCode: idValidation.statusCode
                };
            }

            // Validar estado
            const statusValidation = complaintsValidator.validateComplaintStatus(complaint_status);
            if (!statusValidation.isValid) {
                logBusinessEvent('COMPLAINT_STATUS_UPDATE_VALIDATION_FAILED', {
                    reason: statusValidation.message,
                    complaintId: idValidation.data
                }, correlationId);
                return {
                    success: false,
                    message: statusValidation.message,
                    statusCode: statusValidation.statusCode
                };
            }

            if (!username) {
                logBusinessEvent('COMPLAINT_STATUS_UPDATE_VALIDATION_FAILED', {
                    reason: 'Usuario requerido',
                    complaintId: idValidation.data
                }, correlationId);
                return {
                    success: false,
                    message: 'Se requiere un usuario para realizar esta acción',
                    statusCode: 400
                };
            }

            // Validar sesión activa del usuario
            const sessionValidation = await authService.validateSession(username);
            if (!sessionValidation.success || !sessionValidation.data?.isActive) {
                logBusinessEvent('COMPLAINT_STATUS_UPDATE_SESSION_INVALID', {
                    username,
                    complaintId: idValidation.data
                }, correlationId);
                return {
                    success: false,
                    message: 'Sesión inactiva. Por favor, inicie sesión nuevamente.',
                    statusCode: 401
                };
            }

            // Obtener el estado actual antes de actualizar
            const currentComplaint = await complaintsRepository.findById(idValidation.data);
            const previousStatus = currentComplaint ? currentComplaint.complaint_status : null;

            // Actualizar el estado
            const wasUpdated = await complaintsRepository.updateStatus(idValidation.data, complaint_status);

            if (wasUpdated) {
                logDatabaseOperation('UPDATE', 'complaints', {
                    complaintId: idValidation.data,
                    previousStatus,
                    newStatus: complaint_status
                }, correlationId);

                logBusinessEvent('COMPLAINT_STATUS_UPDATED', {
                    complaintId: idValidation.data,
                    previousStatus,
                    newStatus: complaint_status,
                    changedBy: username
                }, correlationId);

                // Publicar evento de cambio de estado (Event Sourcing)
                if (process.env.KAFKA_ENABLED === 'true') {
                    this._publishStatusChangeEvent(
                        idValidation.data,
                        previousStatus,
                        complaint_status,
                        username,
                        `Estado cambiado de ${previousStatus} a ${complaint_status}`,
                        correlationId
                    ).catch(error => {
                        logError(error, { operation: 'publishStatusChangeEvent', complaintId: idValidation.data }, correlationId);
                    });
                }

                // Obtener datos completos de la queja actualizada para el email
                const complaint = await complaintsRepository.findById(idValidation.data);

                // Enviar notificación por email (asíncrono, no bloquea la respuesta)
                if (complaint && process.env.KAFKA_ENABLED === 'true') {
                    this._sendComplaintUpdateNotificationEmail(complaint, complaint_status, correlationId).catch(error => {
                        logError(error, { operation: 'sendComplaintUpdateNotificationEmail', complaintId: idValidation.data }, correlationId);
                    });
                }

                logBusinessEvent('COMPLAINT_STATUS_UPDATE_SUCCESS', {
                    complaintId: idValidation.data,
                    newStatus: complaint_status
                }, correlationId);

                return {
                    success: true,
                    message: `Estado de la queja actualizado a: ${complaint_status}`,
                    statusCode: 200
                };
            } else {
                logBusinessEvent('COMPLAINT_STATUS_UPDATE_NOT_FOUND', {
                    complaintId: idValidation.data
                }, correlationId);
                return {
                    success: false,
                    message: 'Queja no encontrada',
                    statusCode: 404
                };
            }
        } catch (error) {
            logError(error, { operation: 'updateComplaintStatus', complaintId: id_complaint, status: complaint_status }, correlationId);
            return {
                success: false,
                message: 'Error interno al actualizar el estado de la queja',
                statusCode: 500
            };
        }
    }

    /**
     * Obtener estadísticas de quejas
     * @returns {Promise<Object>} Resultado de la operación
     */
    async getComplaintsStats() {
        try {
            const [entityStats, statusStats] = await Promise.all([
                complaintsRepository.getStatsByEntity(),
                complaintsRepository.getStatsByStatus()
            ]);

            return {
                success: true,
                data: {
                    entityStats,
                    statusStats
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('[ERROR] Error fetching complaints stats:', error.message);
            return {
                success: false,
                message: 'Error al obtener las estadísticas',
                statusCode: 500
            };
        }
    }

    /**
     * Obtener todas las entidades públicas
     * @returns {Promise<Object>} Resultado de la operación
     */
    async getAllEntities() {
        try {
            const entities = await entitiesRepository.findAll();
            return {
                success: true,
                data: entities,
                statusCode: 200
            };
        } catch (error) {
            console.error('[ERROR] Error fetching entities:', error.message);
            return {
                success: false,
                message: 'Error al obtener las entidades',
                statusCode: 500
            };
        }
    }

    /**
     * Obtener detalles completos de una queja con comentarios
     * @param {string|number} id_complaint - ID de la queja
     * @returns {Promise<Object>} Resultado de la operación
     */
    async getComplaintDetails(id_complaint) {
        try {
            // Validar ID de queja
            const idValidation = complaintsValidator.validateComplaintId(id_complaint);
            if (!idValidation.isValid) {
                return {
                    success: false,
                    message: idValidation.message,
                    statusCode: idValidation.statusCode
                };
            }

            // Obtener datos de la queja y comentarios en paralelo
            const [complaint, comments] = await Promise.all([
                complaintsRepository.findById(idValidation.data),
                commentsRepository.findByComplaintId(idValidation.data)
            ]);

            if (!complaint) {
                return {
                    success: false,
                    message: 'Queja no encontrada',
                    statusCode: 404
                };
            }

            return {
                success: true,
                data: {
                    complaint,
                    comments
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('[ERROR] Error fetching complaint details:', error.message);
            return {
                success: false,
                message: 'Error al obtener los detalles de la queja',
                statusCode: 500
            };
        }
    }

    /**
     * Obtener comentarios de una queja
     * @param {string|number} id_complaint - ID de la queja
     * @returns {Promise<Object>} Resultado de la operación
     */
    async getComments(id_complaint) {
        try {
            // Validar ID de queja
            const idValidation = complaintsValidator.validateComplaintId(id_complaint);
            if (!idValidation.isValid) {
                return {
                    success: false,
                    message: idValidation.message,
                    statusCode: idValidation.statusCode
                };
            }

            const comments = await commentsRepository.findByComplaintId(idValidation.data);

            return {
                success: true,
                data: comments,
                statusCode: 200
            };
        } catch (error) {
            console.error('[ERROR] Error fetching comments:', error.message);
            return {
                success: false,
                message: 'Error al obtener los comentarios',
                statusCode: 500
            };
        }
    }

    /**
     * Agregar un comentario a una queja
     * @param {string|number} id_complaint - ID de la queja
     * @param {string} comment_text - Texto del comentario
     * @returns {Promise<Object>} Resultado de la operación
     */
    async addComment(id_complaint, comment_text) {
        try {
            // Validar datos del comentario
            const validation = complaintsValidator.validateCommentData(id_complaint, comment_text);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: validation.message,
                    statusCode: validation.statusCode
                };
            }

            // Verificar que la queja existe y está activa
            const complaint = await complaintsRepository.findById(validation.data.id_complaint);
            if (!complaint) {
                return {
                    success: false,
                    message: 'Queja no encontrada o inactiva',
                    statusCode: 404
                };
            }

            // Crear el comentario
            const commentId = await commentsRepository.create(validation.data);

            return {
                success: true,
                message: 'Comentario agregado exitosamente',
                statusCode: 201,
                data: { id_comment: commentId }
            };
        } catch (error) {
            console.error('[ERROR] Error adding comment:', error.message);
            return {
                success: false,
                message: 'Error interno al agregar el comentario',
                statusCode: 500
            };
        }
    }

    /**
     * Enviar notificación de nueva queja por email
     * @private
     * @param {Object} complaint - Datos de la queja
     * @param {string} correlationId - ID de correlación
     * @returns {Promise<void>}
     */
    async _sendComplaintNotificationEmail(complaint, correlationId = null) {
        try {
            logBusinessEvent('EMAIL_NOTIFICATION_STARTED', {
                type: 'COMPLAINT_CREATED',
                complaintId: complaint.id_complaint
            }, correlationId);

            const emailPublisher = EmailPublisherService.getInstance();
            const complaintData = prepareComplaintData(complaint);
            const { recipients, ccRecipients } = getEmailRecipientsFromEnv();

            if (recipients.length > 0) {
                await emailPublisher.publishComplaintNotification(
                    complaintData,
                    recipients,
                    ccRecipients,
                    correlationId
                );
                logBusinessEvent('EMAIL_NOTIFICATION_PUBLISHED', {
                    type: 'COMPLAINT_CREATED',
                    complaintId: complaint.id_complaint,
                    recipients: recipients.length
                }, correlationId);
            }
        } catch (error) {
            logError(error, { operation: '_sendComplaintNotificationEmail', complaintId: complaint.id_complaint }, correlationId);
            // No lanzar error para no afectar el flujo principal
        }
    }

    /**
     * Enviar notificación de actualización de queja por email
     * @private
     * @param {Object} complaint - Datos de la queja
     * @param {string} newStatus - Nuevo estado
     * @param {string} correlationId - ID de correlación
     * @returns {Promise<void>}
     */
    async _sendComplaintUpdateNotificationEmail(complaint, newStatus, correlationId = null) {
        try {
            logBusinessEvent('EMAIL_NOTIFICATION_STARTED', {
                type: 'COMPLAINT_UPDATED',
                complaintId: complaint.id_complaint,
                newStatus
            }, correlationId);

            const emailPublisher = EmailPublisherService.getInstance();
            const complaintData = prepareComplaintData(complaint, newStatus);
            const { recipients, ccRecipients } = getEmailRecipientsFromEnv();

            if (recipients.length > 0) {
                await emailPublisher.publishComplaintUpdateNotification(
                    complaintData,
                    recipients,
                    ccRecipients,
                    correlationId
                );
                logBusinessEvent('EMAIL_NOTIFICATION_PUBLISHED', {
                    type: 'COMPLAINT_UPDATED',
                    complaintId: complaint.id_complaint,
                    newStatus,
                    recipients: recipients.length
                }, correlationId);
            }
        } catch (error) {
            logError(error, { operation: '_sendComplaintUpdateNotificationEmail', complaintId: complaint.id_complaint }, correlationId);
            // No lanzar error para no afectar el flujo principal
        }
    }

    /**
     * Publicar evento de cambio de estado para Event Sourcing
     * @private
     * @param {number} id_complaint - ID de la queja
     * @param {string|null} previous_status - Estado anterior
     * @param {string} new_status - Nuevo estado
     * @param {string} changed_by - Usuario que realizó el cambio
     * @param {string} change_description - Descripción del cambio
     * @param {string} correlationId - ID de correlación
     * @returns {Promise<void>}
     */
    async _publishStatusChangeEvent(id_complaint, previous_status, new_status, changed_by, change_description, correlationId = null) {
        try {
            logBusinessEvent('EVENT_SOURCING_PUBLISH_STARTED', {
                complaintId: id_complaint,
                previousStatus: previous_status,
                newStatus: new_status,
                changedBy: changed_by
            }, correlationId);

            const eventPublisher = getPublisherInstance();
            await eventPublisher.publishStatusChangeEvent({
                id_complaint,
                previous_status,
                new_status,
                changed_by,
                change_description,
            }, correlationId);

            logBusinessEvent('EVENT_SOURCING_PUBLISHED', {
                complaintId: id_complaint,
                previousStatus: previous_status,
                newStatus: new_status
            }, correlationId);
        } catch (error) {
            logError(error, { operation: '_publishStatusChangeEvent', complaintId: id_complaint }, correlationId);
            // No lanzar error para no afectar el flujo principal
        }
    }
}

module.exports = new ComplaintsService();
