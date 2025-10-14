const authService = require('../services/authService');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña son requeridos'
            });
        }

        const result = await authService.login(username, password);
        
        if (result.success) {
            res.status(result.statusCode).json({
                success: true,
                data: result.data,
                message: result.message
            });
        } else {
            res.status(result.statusCode).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error in login controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

exports.validateSession = async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'El username es requerido'
            });
        }

        const result = await authService.validateSession(username);
        
        if (result.success) {
            res.status(result.statusCode).json({
                success: true,
                data: result.data,
                message: result.message
            });
        } else {
            res.status(result.statusCode).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error in validateSession controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

exports.logout = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'El username es requerido'
            });
        }

        const result = await authService.logout(username);
        
        if (result.success) {
            res.status(result.statusCode).json({
                success: true,
                message: result.message
            });
        } else {
            res.status(result.statusCode).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error in logout controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
