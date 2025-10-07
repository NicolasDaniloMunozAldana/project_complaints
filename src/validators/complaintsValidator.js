require('dotenv').config();

const DELETE_PASSWORD = process.env.ADMIN_PASSWORD;
const { PARSE_BASE } = require('../config/constants');

class ComplaintsValidator {
    /**
     * Validar datos para crear una queja
     * @param {string|number} entity - ID de la entidad
     * @param {string} description - Descripción de la queja
     * @returns {Object} Resultado de la validación
     */
    validateComplaintData(entity, description) {
        // Verificar que los campos requeridos estén presentes
        if (!entity || !description) {
            return {
                isValid: false,
                message: 'La entidad y descripción son requeridas',
                statusCode: 400
            };
        }

        // Validar que entity sea un número válido
        if (isNaN(Number(entity))) {
            return {
                isValid: false,
                message: 'ID de entidad debe ser un número válido',
                statusCode: 400
            };
        }

        // Validar longitud mínima de descripción
        if (description.trim().length < 10) {
            return {
                isValid: false,
                message: 'La descripción debe tener al menos 10 caracteres',
                statusCode: 400
            };
        }

        // Validar longitud máxima de descripción
        if (description.trim().length > 1000) {
            return {
                isValid: false,
                message: 'La descripción no puede exceder 1000 caracteres',
                statusCode: 400
            };
        }

        return {
            isValid: true,
            data: {
                id_public_entity: parseInt(entity, PARSE_BASE),
                description: description.trim()
            }
        };
    }

    /**
     * Validar contraseña de administrador
     * @param {string} password - Contraseña a validar
     * @returns {Object} Resultado de la validación
     */
    validateAdminPassword(password) {
        if (!password) {
            return {
                isValid: false,
                message: 'Contraseña es requerida',
                statusCode: 400
            };
        }

        if (password !== DELETE_PASSWORD) {
            return {
                isValid: false,
                message: 'Contraseña incorrecta',
                statusCode: 401
            };
        }

        return {
            isValid: true
        };
    }

    /**
     * Validar estado de queja
     * @param {string} complaint_status - Estado a validar
     * @returns {Object} Resultado de la validación
     */
    validateComplaintStatus(complaint_status) {
        const allowedStatuses = ['abierta', 'en_revision', 'cerrada'];
        
        if (!complaint_status) {
            return {
                isValid: false,
                message: 'Estado de queja es requerido',
                statusCode: 400
            };
        }

        if (!allowedStatuses.includes(complaint_status)) {
            return {
                isValid: false,
                message: `Estado no válido. Los estados permitidos son: ${allowedStatuses.join(', ')}`,
                statusCode: 400
            };
        }

        return {
            isValid: true
        };
    }

    /**
     * Validar ID de queja
     * @param {string|number} id_complaint - ID a validar
     * @returns {Object} Resultado de la validación
     */
    validateComplaintId(id_complaint) {
        if (!id_complaint) {
            return {
                isValid: false,
                message: 'ID de queja es requerido',
                statusCode: 400
            };
        }

        if (isNaN(Number(id_complaint))) {
            return {
                isValid: false,
                message: 'ID de queja debe ser un número válido',
                statusCode: 400
            };
        }

        return {
            isValid: true,
            data: parseInt(id_complaint, 10)
        };
    }

    /**
     * Validar datos para comentario
     * @param {string|number} id_complaint - ID de la queja
     * @param {string} comment_text - Texto del comentario
     * @returns {Object} Resultado de la validación
     */
    validateCommentData(id_complaint, comment_text) {
        // Validar ID de queja
        const idValidation = this.validateComplaintId(id_complaint);
        if (!idValidation.isValid) {
            return idValidation;
        }

        // Validar texto del comentario
        if (!comment_text) {
            return {
                isValid: false,
                message: 'Texto del comentario es requerido',
                statusCode: 400
            };
        }

        if (comment_text.trim().length < 10) {
            return {
                isValid: false,
                message: 'El comentario debe tener al menos 10 caracteres',
                statusCode: 400
            };
        }

        if (comment_text.trim().length > 500) {
            return {
                isValid: false,
                message: 'El comentario no puede exceder 500 caracteres',
                statusCode: 400
            };
        }

        return {
            isValid: true,
            data: {
                id_complaint: idValidation.data,
                comment_text: comment_text.trim()
            }
        };
    }
}

module.exports = new ComplaintsValidator();