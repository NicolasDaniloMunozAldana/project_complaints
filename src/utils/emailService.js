// ============================================================================
// ARCHIVO DE COMPATIBILIDAD - Mantiene la interfaz original
// ============================================================================
// Este archivo mantiene la compatibilidad con el código existente mientras
// utiliza internamente la nueva arquitectura desacoplada de servicios de email.

const EmailServiceFactory = require('../services/EmailServiceFactory');

// Instancia única del servicio de email (Singleton)
let emailServiceInstance = null;

/**
 * Obtiene la instancia del servicio de email
 * @returns {IEmailService} Instancia del servicio
 */
const getEmailService = () => {
  if (!emailServiceInstance) {
    try {
      emailServiceInstance = EmailServiceFactory.getInstance();
      console.log('📧 Servicio de email inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando servicio de email:', error.message);
      throw error;
    }
  }
  return emailServiceInstance;
};

/**
 * Función de compatibilidad - Crea transportador
 * @deprecated Usar directamente el servicio de email
 * @returns {Object} Transportador de nodemailer
 */
const createTransporter = () => {
  console.warn('⚠️  createTransporter está deprecated. Usar EmailServiceFactory en su lugar.');
  const service = getEmailService();
  return service.createTransporter();
};

/**
 * Función de compatibilidad - Genera plantilla de email
 * @deprecated Usar directamente el servicio de email
 * @param {Object} data - Datos para la plantilla
 * @returns {string} HTML de la plantilla
 */
const generateEmailTemplate = (data) => {
  console.warn('⚠️  generateEmailTemplate está deprecated. Usar EmailServiceFactory en su lugar.');
  const service = getEmailService();
  return service.generateEmailTemplate(data);
};

/**
 * Envía un correo de notificación usando la nueva arquitectura
 * @param {Object} req - Objeto request de Express
 * @param {string} action - Acción realizada
 * @returns {Promise<void>}
 */
const sendNotificationEmail = async (req, action) => {
  try {
    const service = getEmailService();
    await service.sendNotificationEmail(req, action);
  } catch (error) {
    console.error('❌ Error en emailService.sendNotificationEmail:', error.message);
    // No relanzar el error para evitar que rompa la aplicación
  }
};

/**
 * Función para probar el servicio de email
 * @param {string} to - Destinatario del correo de prueba
 * @returns {Promise<Object>} Información del correo enviado
 */
const sendTestEmail = async (to) => {
  try {
    const service = getEmailService();
    if (typeof service.sendTestEmail === 'function') {
      return await service.sendTestEmail(to);
    } else {
      throw new Error('Método sendTestEmail no disponible en el servicio actual');
    }
  } catch (error) {
    console.error('❌ Error enviando correo de prueba:', error.message);
    throw error;
  }
};

/**
 * Reinicia el servicio de email (útil para testing)
 */
const resetEmailService = () => {
  emailServiceInstance = null;
  EmailServiceFactory.resetInstance();
  console.log('🔄 Servicio de email reiniciado');
};

// Exportaciones para mantener compatibilidad
module.exports = { 
  sendNotificationEmail,
  sendTestEmail,
  resetEmailService,
  // Funciones deprecated pero mantenidas por compatibilidad
  createTransporter,
  generateEmailTemplate,
  // Nueva función para acceder al servicio directamente
  getEmailService
};
