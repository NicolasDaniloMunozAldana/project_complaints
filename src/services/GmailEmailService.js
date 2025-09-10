const nodemailer = require('nodemailer');
const IEmailService = require('../interfaces/IEmailService');

/**
 * Implementación del servicio de correo para Gmail
 * Extiende la interfaz IEmailService
 */


// Importar constantes
const { GMAIL, EMAIL_TEMPLATE } = require('../config/constants');

class GmailEmailService extends IEmailService {
  constructor() {
    super();
    this.validateConfiguration();
  }

  /**
   * Valida que las credenciales de Gmail estén configuradas
   * @returns {boolean} True si la configuración es válida
   * @throws {Error} Si faltan credenciales
   */
  validateConfiguration() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('EMAIL_USER y EMAIL_PASSWORD deben estar configurados en las variables de entorno');
    }
    return true;
  }

  /**
   * Crea el transportador de nodemailer para Gmail
   * @returns {Object} Transportador configurado
   */
  createTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      pool: true, // Usar pool de conexiones para mejor rendimiento
  maxConnections: GMAIL.MAX_CONNECTIONS,
  maxMessages: GMAIL.MAX_MESSAGES
    });
  }

  /**
   * Genera la plantilla HTML para el correo
   * @param {Object} data - Datos para la plantilla
   * @returns {string} HTML de la plantilla
   */
  generateEmailTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: ${EMAIL_TEMPLATE.MAX_WIDTH}px;
            margin: 0 auto;
            padding: ${EMAIL_TEMPLATE.PADDING}px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: ${EMAIL_TEMPLATE.PADDING}px;
            text-align: center;
          }
          .header h2 {
            margin: 0;
            font-size: ${EMAIL_TEMPLATE.HEADER_FONT_SIZE}px;
          }
          .content {
            padding: ${EMAIL_TEMPLATE.CONTENT_PADDING}px;
          }
          .content h3 {
            color: #333;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .detail-row {
            margin-bottom: ${EMAIL_TEMPLATE.DETAIL_ROW_MARGIN_BOTTOM}px;
            padding: ${EMAIL_TEMPLATE.DETAIL_ROW_PADDING}px;
            background-color: #f8f9fa;
            border-left: ${EMAIL_TEMPLATE.DETAIL_ROW_BORDER_LEFT}px solid #667eea;
            border-radius: 4px;
          }
          .label {
            font-weight: bold;
            color: #555;
            display: inline-block;
            min-width: ${EMAIL_TEMPLATE.LABEL_MIN_WIDTH}px;
          }
          .value {
            color: #333;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
            border-top: 1px solid #eee;
          }
          .timestamp {
            background-color: #e3f2fd;
            color: #1976d2;
            padding: 5px 10px;
            border-radius: 15px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔔 Sistema de Reportes de Quejas</h2>
          </div>
          <div class="content">
            <h3>Notificación de Solicitud de Reporte</h3>
            <div class="detail-row">
              <span class="label">📋 Acción realizada:</span>
              <span class="value">${data.action}</span>
            </div>
            <div class="detail-row">
              <span class="label">🕒 Fecha y hora:</span>
              <span class="value timestamp">${data.timestamp}</span>
            </div>
            <div class="detail-row">
              <span class="label">🌐 Dirección IP:</span>
              <span class="value">${data.ip}</span>
            </div>
            <div class="detail-row">
              <span class="label">🔗 URL solicitada:</span>
              <span class="value">${data.url}</span>
            </div>
            <div class="detail-row">
              <span class="label">📡 Método HTTP:</span>
              <span class="value">${data.method}</span>
            </div>
            <div class="detail-row">
              <span class="label">🖥️ User-Agent:</span>
              <span class="value" style="word-break: break-all;">${data.userAgent}</span>
            </div>
          </div>
          <div class="footer">
            <p>✉️ Este es un mensaje automático, por favor no responder.</p>
            <p>Sistema de Gestión de Quejas - ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Envía un correo de notificación
   * @param {Object} req - Objeto request de Express
   * @param {string} action - Acción realizada
   * @returns {Promise<void>}
   */
  async sendNotificationEmail(req, action) {
    try {
      // Filtrar solo las rutas de interés
      if (!req.originalUrl.includes('/complaints/list') && 
          !req.originalUrl.includes('/complaints/stats')) {
        return;
      }

      const transporter = this.createTransporter();
      
      const emailData = {
        action: action,
        timestamp: new Date().toLocaleString('es-CO', { 
          timeZone: 'America/Bogota',
          dateStyle: 'full',
          timeStyle: 'medium'
        }),
        ip: req.ip || req.connection.remoteAddress || 'No disponible',
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent') || 'No especificado'
      };

      const mailOptions = {
        from: {
          name: 'Sistema de Quejas',
          address: process.env.EMAIL_USER
        },
        to: 'munozaldananicolasdanilo@gmail.com',
        cc: 'quejas.entidadesboyaca@gmail.com',
        subject: `🔔 Solicitud de Reporte - ${action}`,
        html: this.generateEmailTemplate(emailData),
        priority: 'normal',
        headers: {
          'X-Mailer': 'Sistema de Quejas v1.0',
          'X-Priority': '3'
        }
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Correo de notificación enviado correctamente:', info.messageId);
      
      // Cerrar el transportador para liberar recursos
      transporter.close();
      
      return info;
    } catch (error) {
      console.error('❌ Error al enviar el correo de notificación:', error.message);
      throw error;
    }
  }

  /**
   * Método para enviar correos de prueba
   * @param {string} to - Destinatario del correo de prueba
   * @returns {Promise<Object>} Información del correo enviado
   */
  async sendTestEmail(to = 'munozaldananicolasdanilo@gmail.com') {
    try {
      const transporter = this.createTransporter();
      
      const mailOptions = {
        from: {
          name: 'Sistema de Quejas - Prueba',
          address: process.env.EMAIL_USER
        },
        to: to,
        subject: '🧪 Correo de Prueba - Sistema de Quejas',
        html: `
          <h2>✅ Prueba de Configuración Exitosa</h2>
          <p>Este correo confirma que el servicio de email está funcionando correctamente.</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
          <p><strong>Servicio:</strong> Gmail</p>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Correo de prueba enviado:', info.messageId);
      transporter.close();
      return info;
    } catch (error) {
      console.error('❌ Error en correo de prueba:', error.message);
      throw error;
    }
  }
}

module.exports = GmailEmailService;
