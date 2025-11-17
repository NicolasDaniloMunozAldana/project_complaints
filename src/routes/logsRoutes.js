const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logsController');

// Interfaz de visualización de logs
router.get('/', logsController.renderLogsViewer);

// API endpoints
router.get('/api/files', logsController.getLogFiles);
router.get('/api/:filename', logsController.getLogs);
router.get('/api/search/:correlationId', logsController.searchByCorrelationId);
router.get('/api/errors/recent', logsController.getRecentErrors);

module.exports = router;
