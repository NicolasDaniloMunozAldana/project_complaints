const logViewerService = require('../services/logViewerService');

class LogViewerController {
  /**
   * Render the log viewer dashboard
   */
  async renderDashboard(req, res) {
    try {
      res.render('log_viewer');
    } catch (error) {
      console.error('Error rendering log viewer:', error);
      res.status(500).send('Error al cargar el visor de logs');
    }
  }

  /**
   * Get list of available log files
   */
  async getLogFiles(req, res) {
    try {
      const files = await logViewerService.getLogFiles();
      res.json(files);
    } catch (error) {
      console.error('Error getting log files:', error);
      res.status(500).json({ error: 'Error al obtener archivos de log' });
    }
  }

  /**
   * Get logs from a specific file with filters
   */
  async getLogs(req, res) {
    try {
      const { filename, level, correlationId, search, limit, offset } = req.query;

      if (!filename) {
        return res.status(400).json({ error: 'Filename is required' });
      }

      const filters = {
        level: level || null,
        correlationId: correlationId || null,
        search: search || null,
        limit: parseInt(limit) || 100,
        offset: parseInt(offset) || 0
      };

      const result = await logViewerService.readLogs(filename, filters);
      res.json(result);
    } catch (error) {
      console.error('Error reading logs:', error);
      res.status(500).json({ error: 'Error al leer los logs' });
    }
  }

  /**
   * Get statistics for a log file
   */
  async getLogStats(req, res) {
    try {
      const { filename } = req.query;

      if (!filename) {
        return res.status(400).json({ error: 'Filename is required' });
      }

      const stats = await logViewerService.getLogStats(filename);
      res.json(stats);
    } catch (error) {
      console.error('Error getting log stats:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }

  /**
   * Search logs by correlation ID across all files
   */
  async searchByCorrelationId(req, res) {
    try {
      const { correlationId } = req.query;

      if (!correlationId) {
        return res.status(400).json({ error: 'Correlation ID is required' });
      }

      const results = await logViewerService.searchByCorrelationId(correlationId);
      res.json(results);
    } catch (error) {
      console.error('Error searching by correlation ID:', error);
      res.status(500).json({ error: 'Error al buscar por correlation ID' });
    }
  }

  /**
   * Get recent errors across all log files
   */
  async getRecentErrors(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const errors = await logViewerService.getRecentErrors(limit);
      res.json(errors);
    } catch (error) {
      console.error('Error getting recent errors:', error);
      res.status(500).json({ error: 'Error al obtener errores recientes' });
    }
  }
}

module.exports = new LogViewerController();
