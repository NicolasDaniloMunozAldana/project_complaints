const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

// Puerta de entrada para renderizar la vista de login
router.get('/login', loginController.renderLogin);

module.exports = router;
