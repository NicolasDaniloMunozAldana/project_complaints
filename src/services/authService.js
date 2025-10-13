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
