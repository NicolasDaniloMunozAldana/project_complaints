const express = require('express');
const router = express.Router();
const logViewerController = require('../controllers/logViewerController');

/**
 * GET /logs
 * Render the log viewer dashboard
 */
router.get('/', logViewerController.renderDashboard);

/**
 * GET /logs/api/logs/files
 * Get list of available log files
 */
router.get('/api/logs/files', logViewerController.getLogFiles);

/**
 * GET /logs/api/logs
 * Get logs from a specific file with filters
 * Query params: filename, level, correlationId, search, limit, offset
 */
router.get('/api/logs', logViewerController.getLogs);

/**
 * GET /logs/api/logs/stats
 * Get statistics for a log file
 * Query params: filename
 */
router.get('/api/logs/stats', logViewerController.getLogStats);

/**
 * GET /logs/api/logs/correlation/:correlationId
 * Search logs by correlation ID across all files
 */
router.get('/api/logs/correlation', logViewerController.searchByCorrelationId);

/**
 * GET /logs/api/logs/errors/recent
 * Get recent errors across all log files
 */
router.get('/api/logs/errors/recent', logViewerController.getRecentErrors);

module.exports = router;
