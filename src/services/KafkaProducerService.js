/**
 * Kafka Producer Service
 * Publishes email notifications to project_email_sender
 */

const { Kafka } = require('kafkajs');
const kafkaConfig = require('../config/kafkaConfig');
const { EMAIL_CONFIG, EMAIL_EVENT_TYPES } = require('../config/constants');

class KafkaProducerService {
  constructor() {
    this.kafka = null;
    this.producer = null;
    this.isConnected = false;
  }

  /**
   * Initialize Kafka producer
   * @returns {Promise<void>}
   */
  async initialize() {
    if (!kafkaConfig.enabled) {
      console.log('[WARN] Kafka is disabled, running in synchronous mode');
      return;
    }

    try {
      this.kafka = new Kafka({
        clientId: kafkaConfig.clientId,
        brokers: kafkaConfig.brokers,
        connectionTimeout: kafkaConfig.connectionTimeout,
        requestTimeout: kafkaConfig.requestTimeout,
        retry: {
          initialRetryTime: kafkaConfig.retries.initialRetryTime,
          retries: kafkaConfig.retries.maxAttempts,
          maxRetryTime: kafkaConfig.retries.maxRetryTime,
          multiplier: kafkaConfig.retries.multiplier,
        },
      });

      this.producer = this.kafka.producer(kafkaConfig.producer);
      await this.producer.connect();
      this.isConnected = true;
      console.log('[OK] Kafka Producer connected successfully');
    } catch (error) {
      console.error('[ERROR] Failed to connect Kafka Producer:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Publish an email notification request to Kafka
   * Data will be processed by project_email_sender
   * @param {Object} emailData - Email notification data
   * @returns {Promise<void>}
   */
  async publishEmailNotification(emailData) {
    if (!kafkaConfig.enabled || !this.isConnected) {
      console.log(
        '[WARN] Kafka disabled or not connected, skipping email notification',
      );
      return;
    }

    try {
      const messageValue = {
        id: emailData.id,
        timestamp: new Date().toISOString(),
        to: emailData.to,
        cc: this._normalizeArray(emailData.cc),
        subject: emailData.subject,
        html: emailData.html || null,
        title: emailData.title || null,
        fromName: emailData.fromName || EMAIL_CONFIG.DEFAULT_FROM_NAME,
        priority: emailData.priority || EMAIL_CONFIG.DEFAULT_PRIORITY,
        retries: emailData.retries || 0,
        metadata: {
          ...(emailData.metadata || {}),
          eventType:
            emailData.metadata?.eventType || EMAIL_EVENT_TYPES.NOTIFICATION,
          source: EMAIL_CONFIG.DEFAULT_SOURCE,
        },
        // For complaint-specific emails
        ...(emailData.complaintId && {
          complaintId: emailData.complaintId,
          description: emailData.description,
          status: emailData.status,
          entityName: emailData.entityName,
          createdAt: emailData.createdAt,
        }),
        // Action field for email templates
        ...(emailData.action && { action: emailData.action }),
      };

      await this.producer.send({
        topic: kafkaConfig.topics.emailNotifications,
        messages: [
          {
            key: `email-${emailData.id}`,
            value: JSON.stringify(messageValue),
            headers: {
              'event-type': EMAIL_EVENT_TYPES.NOTIFICATION,
              source: EMAIL_CONFIG.DEFAULT_SOURCE,
              priority: emailData.priority || EMAIL_CONFIG.DEFAULT_PRIORITY,
            },
          },
        ],
      });
      console.log(
        `[OK] Email notification published to Kafka: ${emailData.id}`,
      );
    } catch (error) {
      console.error(
        '[ERROR] Error publishing email notification:',
        error.message,
      );
      throw error;
    }
  }

  /**
   * Normalize array values (handles string, array, or undefined)
   * @private
   * @param {*} value - Value to normalize
   * @returns {Array}
   */
  _normalizeArray(value) {
    if (Array.isArray(value)) {
      return value;
    }
    return value ? [value] : [];
  }

  /**
   * Disconnect the producer
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.producer && this.isConnected) {
      try {
        await this.producer.disconnect();
        this.isConnected = false;
        console.log('[OK] Kafka Producer disconnected');
      } catch (error) {
        console.error(
          '[ERROR] Error disconnecting Kafka Producer:',
          error.message,
        );
        throw error;
      }
    }
  }

  /**
   * Check if producer is connected
   * @returns {boolean}
   */
  isProducerConnected() {
    return this.isConnected;
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create KafkaProducerService instance
 * @returns {KafkaProducerService}
 */
function getInstance() {
  if (!instance) {
    instance = new KafkaProducerService();
  }
  return instance;
}

module.exports = {
  getInstance,
  KafkaProducerService,
};
