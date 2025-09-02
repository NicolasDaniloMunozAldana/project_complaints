const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

const generateEmailTemplate = (data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .content {
          background-color: #fff;
          padding: 20px;
          border-radius: 5px;
          border: 1px solid #ddd;
        }
        .detail-row {
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        .label {
          font-weight: bold;
          color: #555;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Sistema de Reportes de Quejas</h2>
      </div>
      <div class="content">
        <h3>Notificación de Solicitud de Reporte</h3>
        <div class="detail-row">
          <span class="label">Acción realizada:</span> ${data.action}
        </div>
        <div class="detail-row">
          <span class="label">Fecha y hora:</span> ${data.timestamp}
        </div>
        <div class="detail-row">
          <span class="label">Dirección IP:</span> ${data.ip}
        </div>
        <div class="detail-row">
          <span class="label">URL solicitada:</span> ${data.url}
        </div>
        <div class="detail-row">
          <span class="label">Método HTTP:</span> ${data.method}
        </div>
        <div class="detail-row">
          <span class="label">User-Agent:</span> ${data.userAgent}
        </div>
      </div>
      <div class="footer">
        <p>Este es un mensaje automático, por favor no responder.</p>
      </div>
    </body>
    </html>
  `;
};

const sendNotificationEmail = async (req, action) => {
  try {
    if (!req.originalUrl.includes('/complaints/list') && 
        !req.originalUrl.includes('/complaints/stats')) {
      return;
    }

    const transporter = createTransporter();
    
    const emailData = {
      action: action,
      timestamp: new Date().toLocaleString('es-CO', { 
        timeZone: 'America/Bogota',
        dateStyle: 'full',
        timeStyle: 'medium'
      }),
      ip: req.ip || req.connection.remoteAddress,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent') || 'No especificado'
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'munozaldananicolasdanilo@gmail.com',
      cc: 'quejas.entidadesboyaca@gmail.com',
      subject: `Solicitud de Reporte - ${action}`,
      html: generateEmailTemplate(emailData)
    };

    await transporter.sendMail(mailOptions);
    console.log('Correo de notificación enviado correctamente');
  } catch (error) {
    console.error('Error al enviar el correo de notificación:', error);
  }
};

module.exports = { sendNotificationEmail };