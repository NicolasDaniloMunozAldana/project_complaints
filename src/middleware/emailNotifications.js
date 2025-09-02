const { sendNotificationEmail } = require('../utils/emailService');

const emailNotifications = async (req, res, next) => {
  if (req.originalUrl.includes('/complaints/list') || 
      req.originalUrl.includes('/complaints/stats')) {
    
    const originalRender = res.render;
    
    res.render = function(view, options, callback) {
      try {
        if (view.includes('complaints_list')) {
          sendNotificationEmail(req, 'Listado de Quejas Solicitado')
            .catch(err => console.error('Error enviando email:', err));
        } else if (view.includes('complaints_stats')) {
          sendNotificationEmail(req, 'Estadísticas de Quejas Solicitadas')
            .catch(err => console.error('Error enviando email:', err));
        }
      } catch (error) {
        console.error('Error en middleware de email:', error);
      }
      
      return originalRender.call(this, view, options, callback);
    };
  }
  
  next();
};

module.exports = emailNotifications;