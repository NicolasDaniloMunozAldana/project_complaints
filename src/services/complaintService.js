const complaintsRepository = require('../repositories/complaintsRepository');
const entitiesRepository = require('../repositories/entitiesRepository');
const commentsRepository = require('../repositories/commentsRepository');
const complaintsValidator = require('../validators/complaintsValidator');
const authService = require('./authService');

class ComplaintsService {
    /**
     * Crear una nueva queja
     * @param {string|number} entity - ID de la entidad
     * @param {string} description - Descripción de la queja
     * @returns {Promise<Object>} Resultado de la operación
     */
    async createComplaint(entity, description) {
        try {
            // Validar datos de entrada
            const validation = complaintsValidator.validateComplaintData(entity, description);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: validation.message,
                    statusCode: validation.statusCode
                };
            }

            // Verificar que la entidad existe
            const entityExists = await entitiesRepository.exists(validation.data.id_public_entity);
            if (!entityExists) {
                return {
                    success: false,
                    message: 'La entidad pública especificada no existe',
                    statusCode: 400
                };
            }

            // Crear la queja
            const complaintId = await complaintsRepository.create(validation.data);

            return {
                success: true,
                message: 'Queja registrada exitosamente',
                statusCode: 201,
                data: { id_complaint: complaintId }
            };
        } catch (error) {
            console.error('Error creating complaint:', error);
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
            console.error('Error fetching complaints:', error);
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
            console.error('Error deleting complaint:', error);
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
     * @returns {Promise<Object>} Resultado de la operación
     */
    async updateComplaintStatus(id_complaint, complaint_status, username) {
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

            // Validar estado
            const statusValidation = complaintsValidator.validateComplaintStatus(complaint_status);
            if (!statusValidation.isValid) {
                return {
                    success: false,
                    message: statusValidation.message,
                    statusCode: statusValidation.statusCode
                };
            }
                        
            if (!username) {
                return {
                    success: false,
                    message: 'Se requiere un usuario para realizar esta acción',
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

            // Actualizar el estado
            const wasUpdated = await complaintsRepository.updateStatus(idValidation.data, complaint_status);

            if (wasUpdated) {
                return {
                    success: true,
                    message: `Estado de la queja actualizado a: ${complaint_status}`,
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
            console.error('Error updating complaint status:', error);
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
            console.error('Error fetching complaints stats:', error);
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
            console.error('Error fetching entities:', error);
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
            console.error('Error fetching complaint details:', error);
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
            console.error('Error fetching comments:', error);
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
            console.error('Error adding comment:', error);
            return {
                success: false,
                message: 'Error interno al agregar el comentario',
                statusCode: 500
            };
        }
    }
}

module.exports = new ComplaintsService();