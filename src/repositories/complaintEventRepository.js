const axios = require('axios');
const { logEventSourcing, logError } = require('../utils/logger');

/**
 * Cliente HTTP para comunicación con el microservicio de Event Sourcing
 */
class ComplaintEventRepository {
    constructor() {
        this.eventSourcingServiceUrl = process.env.EVENT_SOURCING_SERVICE_URL || 'http://localhost:3001';
    }

    /**
     * Enviar evento al microservicio de Event Sourcing
     * @param {Object} event - Evento a guardar
     * @param {string} correlationId - ID de correlación
     */
    async saveEvent(event, correlationId) {
        try {
            // Log del evento antes de enviarlo
            logEventSourcing(
                'COMPLAINT_STATUS_CHANGED',
                event.complaintId,
                {
                    oldStatus: event.oldStatus,
                    newStatus: event.newStatus,
                    changedBy: event.changedBy,
                    reason: event.reason
                },
                correlationId
            );

            // Enviar evento al microservicio
            const response = await axios.post(
                `${this.eventSourcingServiceUrl}/api/events`,
                {
                    aggregateType: 'COMPLAINT',
                    aggregateId: event.complaintId,
                    eventType: 'STATUS_CHANGED',
                    eventData: {
                        oldStatus: event.oldStatus,
                        newStatus: event.newStatus,
                        changedBy: event.changedBy,
                        reason: event.reason,
                        timestamp: new Date().toISOString()
                    }
                },
                {
                    headers: {
                        'x-correlation-id': correlationId,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                }
            );

            logEventSourcing(
                'EVENT_SENT_TO_SERVICE',
                event.complaintId,
                { response: response.data },
                correlationId
            );

            return { success: true, data: response.data };
        } catch (error) {
            logError(
                error,
                {
                    operation: 'saveComplaintEvent',
                    complaintId: event.complaintId,
                    service: 'event-sourcing',
                    url: `${this.eventSourcingServiceUrl}/api/events`
                },
                correlationId
            );
            
            // No fallar la operación principal si el event sourcing falla
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtener historial de eventos desde el microservicio
     * @param {number} complaintId - ID de la queja
     * @param {string} correlationId - ID de correlación
     */
    async getEventHistory(complaintId, correlationId) {
        try {
            const response = await axios.get(
                `${this.eventSourcingServiceUrl}/api/events/complaint/${complaintId}`,
                {
                    headers: {
                        'x-correlation-id': correlationId
                    },
                    timeout: 5000
                }
            );

            return response.data.events || [];
        } catch (error) {
            logError(
                error,
                {
                    operation: 'getEventHistory',
                    complaintId,
                    service: 'event-sourcing'
                },
                correlationId
            );
            throw error;
        }
    }
}

module.exports = ComplaintEventRepository;
