/**
 * Complaint Status Event Publisher Service
 * Publishes complaint status change events to Kafka for Event Sourcing
 */

const { getInstance } = require('./KafkaProducerService');
const kafkaConfig = require('../config/kafkaConfig');

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
   * @returns {Promise<void>}
   */
  async publishStatusChangeEvent(eventData) {
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
      };

      await this.kafkaProducer.producer.send({
        topic: kafkaConfig.topics.complaintStatusEvents,
        messages: [
          {
            key: `complaint-${eventData.id_complaint}-${Date.now()}`,
            value: JSON.stringify(event),
            headers: {
              'event-type': 'complaint.status.changed',
              'complaint-id': String(eventData.id_complaint),
              'new-status': eventData.new_status,
              timestamp: new Date().toISOString(),
            },
          },
        ],
      });

      console.log(
        `[OK] Status change event published for complaint ${eventData.id_complaint}: ${eventData.previous_status || 'N/A'} -> ${eventData.new_status}`,
      );
    } catch (error) {
      console.error(
        '[ERROR] Error publishing status change event:',
        error.message,
      );
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
