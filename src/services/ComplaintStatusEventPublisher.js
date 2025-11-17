/**
 * Complaint Status Event Publisher Service
 * Publishes complaint status change events to Kafka for Event Sourcing
 */

const { getInstance } = require('./KafkaProducerService');
const kafkaConfig = require('../config/kafkaConfig');
const { logKafkaEvent, logError } = require('../utils/logger');

class ComplaintStatusEventPublisher {
  constructor() {
    this.kafkaProducer = getInstance();
  }

  /**
   * Publish a complaint status change event to Kafka
   * @param {Object} eventData - Event data
   * @param {number} eventData.id_complaint - Complaint ID
   * @param {string} eventData.previous_status - Previous status (optional)
   * @param {string} eventData.new_status - New status
   * @param {string} eventData.changed_by - Username who made the change
   * @param {string} eventData.change_description - Description of the change
   * @param {string} correlationId - Correlation ID for traceability
   * @returns {Promise<void>}
   */
  async publishStatusChangeEvent(eventData, correlationId = null) {
    if (!kafkaConfig.enabled || !this.kafkaProducer.isProducerConnected()) {
      console.log(
        '[WARN] Kafka disabled or not connected, skipping status event publishing',
      );
      return;
    }

    try {
      const event = {
        id_complaint: eventData.id_complaint,
        previous_status: eventData.previous_status || null,
        new_status: eventData.new_status,
        changed_by: eventData.changed_by || 'system',
        change_description: eventData.change_description || null,
        event_timestamp: new Date().toISOString(),
        correlationId: correlationId || null,
      };

      const headers = {
        'event-type': 'complaint.status.changed',
        'complaint-id': String(eventData.id_complaint),
        'new-status': eventData.new_status,
        timestamp: new Date().toISOString(),
      };

      // Agregar correlation ID al header si está disponible
      if (correlationId) {
        headers['x-correlation-id'] = correlationId;
      }

      await this.kafkaProducer.producer.send({
        topic: kafkaConfig.topics.complaintStatusEvents,
        messages: [
          {
            key: `complaint-${eventData.id_complaint}-${Date.now()}`,
            value: JSON.stringify(event),
            headers,
          },
        ],
      });

      logKafkaEvent('PRODUCED', kafkaConfig.topics.complaintStatusEvents, {
        complaintId: eventData.id_complaint,
        previousStatus: eventData.previous_status,
        newStatus: eventData.new_status,
        changedBy: eventData.changed_by
      }, correlationId);

      console.log(
        `[OK] Status change event published for complaint ${eventData.id_complaint}: ${eventData.previous_status || 'N/A'} -> ${eventData.new_status}`,
      );
    } catch (error) {
      logError(error, { 
        operation: 'publishStatusChangeEvent', 
        complaintId: eventData.id_complaint 
      }, correlationId);
      throw error;
    }
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create ComplaintStatusEventPublisher instance
 * @returns {ComplaintStatusEventPublisher}
 */
function getPublisherInstance() {
  if (!instance) {
    instance = new ComplaintStatusEventPublisher();
  }
  return instance;
}

module.exports = {
  getPublisherInstance,
  ComplaintStatusEventPublisher,
};
