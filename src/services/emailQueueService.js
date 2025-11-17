const axios = require('axios');
const { logMessageQueue, logError } = require('../utils/logger');

/**
 * Cliente HTTP para comunicación con el microservicio de Email
 */
class EmailProducer {
    constructor() {
        this.emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://localhost:3002';
    }

    /**
     * Enviar solicitud de correo al microservicio de Email
     * @param {Object} emailData - Datos del correo
     * @param {string} correlationId - ID de correlación
     */
    async produceEmailMessage(emailData, correlationId) {
        try {
            const message = {
                type: 'EMAIL_SEND',
                correlationId,
                timestamp: new Date().toISOString(),
                data: emailData
            };

            // Log antes de enviar al microservicio
            logMessageQueue(
                'PRODUCED',
                'EMAIL_SEND',
                {
                    to: emailData.to,
                    subject: emailData.subject,
                    template: emailData.template
                },
                correlationId
            );

            // Enviar al microservicio de emails
            const response = await axios.post(
                `${this.emailServiceUrl}/api/emails/send`,
                message,
                {
                    headers: {
                        'x-correlation-id': correlationId,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                }
            );

            logMessageQueue(
                'SENT_TO_SERVICE',
                'EMAIL_SEND',
                {
                    to: emailData.to,
                    status: response.data.status
                },
                correlationId
            );

            return { success: true, messageId: correlationId, data: response.data };
        } catch (error) {
            logError(
                error,
                {
                    operation: 'produceEmailMessage',
                    emailTo: emailData.to,
                    service: 'email-service',
                    url: `${this.emailServiceUrl}/api/emails/send`
                },
                correlationId
            );
            
            // No fallar la operación principal si el envío de email falla
            return { success: false, error: error.message };
        }
    }
}

module.exports = { EmailProducer };
