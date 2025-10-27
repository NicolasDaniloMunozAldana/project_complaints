const axios = require('axios');
const { AUTH_SERVICE_URL } = require('../config/constants');

/**
 * Autentica un usuario contra el microservicio de auth
 */
exports.login = async (username, password) => {
    try {
        const response = await axios.post(
            `${AUTH_SERVICE_URL}/api/auth/login`,
            { username, password }
        );

        return {
            success: true,
            statusCode: response.status,
            data: response.data,
            message: 'Autenticación exitosa'
        };
    } catch (error) {
        if (error.response) {
            return {
                success: false,
                statusCode: error.response.status,
                message: error.response.data?.message || 'Error al autenticar usuario'
            };
        }
        
        return {
            success: false,
            statusCode: 503,
            message: 'Servicio de autenticación no disponible'
        };
    }
};

/**
 * Valida si un usuario tiene sesión activa
 */
exports.validateSession = async (username) => {
    try {
        const response = await axios.get(
            `${AUTH_SERVICE_URL}/api/auth/validate`,
            { params: { username } }
        );

        return {
            success: true,
            statusCode: response.status,
            data: response.data.data,
            message: response.data.message
        };
    } catch (error) {
        if (error.response) {
            return {
                success: false,
                statusCode: error.response.status,
                message: error.response.data?.message || 'Error al validar sesión'
            };
        }
        
        return {
            success: false,
            statusCode: 503,
            message: 'Servicio de autenticación no disponible'
        };
    }
};

/**
 * Cierra la sesión de un usuario
 */
exports.logout = async (username) => {
    try {
        const response = await axios.post(
            `${AUTH_SERVICE_URL}/api/auth/logout`,
            { username }
        );

        return {
            success: true,
            statusCode: response.status,
            message: response.data?.message || 'Sesión cerrada exitosamente'
        };
    } catch (error) {
        if (error.response) {
            return {
                success: false,
                statusCode: error.response.status,
                message: error.response.data?.message || 'Error al cerrar sesión'
            };
        }
        
        return {
            success: false,
            statusCode: 503,
            message: 'Servicio de autenticación no disponible'
        };
    }
};
