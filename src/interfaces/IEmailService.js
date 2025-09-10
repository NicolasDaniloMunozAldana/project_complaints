/**
 * Interfaz para servicios de correo electrónico
 * Define el contrato que deben cumplir todos los proveedores de email
 */
class IEmailService {
  /**
   * Configura el transportador de correo
   * @returns {Object} Transportador configurado
   */
  createTransporter() {
    throw new Error('El método createTransporter debe ser implementado');
  }

  /**
   * Genera la plantilla HTML para el correo
   * @param {Object} data - Datos para llenar la plantilla
   * @returns {string} HTML de la plantilla
   */
  generateEmailTemplate(_data) {
    throw new Error('El método generateEmailTemplate debe ser implementado');
  }

  /**
   * Envía un correo de notificación
   * @param {Object} req - Objeto de request de Express
   * @param {string} action - Acción realizada
   * @returns {Promise<void>}
   */
  async sendNotificationEmail(_req, _action) {
    throw new Error('El método sendNotificationEmail debe ser implementado');
  }

  /**
   * Valida la configuración del servicio
   * @returns {boolean} True si la configuración es válida
   */
  validateConfiguration() {
    throw new Error('El método validateConfiguration debe ser implementado');
  }
}

module.exports = IEmailService;
