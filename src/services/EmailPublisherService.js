/**
 * Email Publisher Service
 * Publishes email notifications to Kafka topic
 * Only handles sending to Kafka, actual email is sent by project_email_sender
 */

const { getInstance: getKafkaProducerInstance } = require('./KafkaProducerService');
const {
  EMAIL_CONFIG,
  EMAIL_EVENT_TYPES,
  EMAIL_ACTIONS,
  EMAIL_SUBJECTS,
  EMAIL_TITLES,
} = require('../config/constants');
const { logKafkaEvent, logError } = require('../utils/logger');

class EmailPublisherService {
  constructor() {
    this.kafkaProducer = null;
  }

  /**
   * Initialize Kafka producer
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.kafkaProducer = getKafkaProducerInstance();
      await this.kafkaProducer.initialize();
    } catch (error) {
      console.error(
        'Error initializing Email Publisher Service:',
        error.message,
      );
      throw error;
    }
  }

  /**
   * Verify Kafka is enabled and producer is ready
   * @private
   * @returns {Promise<boolean>} True if ready, false otherwise
   */
  async _ensureKafkaReady() {
    // Verificar si Kafka está habilitado
    if (process.env.KAFKA_ENABLED !== 'true') {
      console.log('[WARN] Kafka is disabled, skipping email notification');
      return false;
    }

    // Verificar si el producer está inicializado
    if (!this.kafkaProducer) {
      // Intentar inicializar si no está inicializado
      await this.initialize();
    }

    if (!this.kafkaProducer || !this.kafkaProducer.isProducerConnected()) {
      throw new Error(
        'Email Publisher Service not initialized or producer not connected',
      );
    }

    return true;
  }

  /**
   * Publish complaint notification email
   * @param {Object} complaintData - Complaint information
   * @param {Array<string>} recipients - Email recipients
   * @param {Array<string>} ccRecipients - CC recipients
   * @param {string} correlationId - Correlation ID for traceability
   * @returns {Promise<void>}
   */
  async publishComplaintNotification(
    complaintData,
    recipients = [],
    ccRecipients = [],
    correlationId = null,
  ) {
    try {
      const isReady = await this._ensureKafkaReady();
      if (!isReady) {
        return;
      }

      const emailData = {
        id: `email-complaint-${complaintData.id}-${Date.now()}`,
        to: this._normalizeRecipient(recipients),
        cc: this._normalizeRecipients(ccRecipients),
        subject: EMAIL_SUBJECTS.COMPLAINT_NOTIFICATION(complaintData.id),
        title: EMAIL_TITLES.COMPLAINT_NOTIFICATION(
          complaintData.id,
          complaintData.entityName,
        ),
        complaintId: complaintData.id,
        description: complaintData.description,
        status: complaintData.status,
        entityName: complaintData.entityName,
        createdAt: complaintData.createdAt,
        action: EMAIL_ACTIONS.COMPLAINT_CREATED,
        priority: EMAIL_CONFIG.HIGH_PRIORITY,
        correlationId: correlationId || null,
        metadata: {
          eventType: EMAIL_EVENT_TYPES.COMPLAINT_CREATED,
          source: EMAIL_CONFIG.DEFAULT_SOURCE,
        },
      };

      await this._publishEmail(emailData, correlationId);
    } catch (error) {
      logError(error, { 
        operation: 'publishComplaintNotification', 
        complaintId: complaintData.id 
      }, correlationId);
      throw error;
    }
  }

  /**
   * Publish complaint update notification email
   * @param {Object} complaintData - Updated complaint information
   * @param {Array<string>} recipients - Email recipients
   * @param {Array<string>} ccRecipients - CC recipients
   * @param {string} correlationId - Correlation ID for traceability
   * @returns {Promise<void>}
   */
  async publishComplaintUpdateNotification(
    complaintData,
    recipients = [],
    ccRecipients = [],
    correlationId = null,
  ) {
    try {
      const isReady = await this._ensureKafkaReady();
      if (!isReady) {
        return;
      }

      const emailData = {
        id: `email-update-${complaintData.id}-${Date.now()}`,
        to: this._normalizeRecipient(recipients),
        cc: this._normalizeRecipients(ccRecipients),
        subject: EMAIL_SUBJECTS.COMPLAINT_UPDATE(complaintData.id),
        title: EMAIL_TITLES.COMPLAINT_UPDATE(complaintData.id),
        complaintId: complaintData.id,
        status: complaintData.status,
        action: EMAIL_ACTIONS.COMPLAINT_UPDATED(complaintData.status),
        priority: EMAIL_CONFIG.DEFAULT_PRIORITY,
        correlationId: correlationId || null,
        metadata: {
          eventType: EMAIL_EVENT_TYPES.COMPLAINT_UPDATED,
          source: EMAIL_CONFIG.DEFAULT_SOURCE,
        },
      };

      await this._publishEmail(emailData, correlationId);
    } catch (error) {
      logError(error, { 
        operation: 'publishComplaintUpdateNotification', 
        complaintId: complaintData.id 
      }, correlationId);
      throw error;
    }
  }

  /**
   * Publish generic notification email
   * @param {Object} emailOptions - Email configuration
   * @returns {Promise<void>}
   */
  async publishCustomNotification(emailOptions) {
    try {
      const isReady = await this._ensureKafkaReady();
      if (!isReady) {
        return;
      }

      const emailData = {
        id: emailOptions.id || `email-${Date.now()}`,
        to: emailOptions.to,
        cc: this._normalizeRecipients(emailOptions.cc),
        subject: emailOptions.subject || EMAIL_CONFIG.DEFAULT_SUBJECT,
        html: emailOptions.html || null,
        message: emailOptions.message || null,
        title: emailOptions.title,
        priority: emailOptions.priority || EMAIL_CONFIG.DEFAULT_PRIORITY,
        metadata: {
          ...(emailOptions.metadata || {}),
          eventType:
            emailOptions.metadata?.eventType || EMAIL_EVENT_TYPES.NOTIFICATION,
          source: EMAIL_CONFIG.DEFAULT_SOURCE,
        },
      };

      await this._publishEmail(emailData);
    } catch (error) {
      console.error(
        '[ERROR] Error publishing custom notification:',
        error.message,
      );
      throw error;
    }
  }

  /**
   * Publish email notification to Kafka (internal helper)
   * @private
   * @param {Object} emailData - Email data to publish
   * @param {string} correlationId - Correlation ID for traceability
   * @returns {Promise<void>}
   */
  async _publishEmail(emailData, correlationId = null) {
    try {
      await this.kafkaProducer.publishEmailNotification(emailData);
      
      logKafkaEvent('PRODUCED', 'email-notifications', {
        emailId: emailData.id,
        complaintId: emailData.complaintId,
        to: emailData.to,
        subject: emailData.subject
      }, correlationId);
      
      console.log(`[OK] Email notification published to Kafka: ${emailData.id}`);
    } catch (error) {
      logError(error, { 
        operation: '_publishEmail', 
        emailId: emailData.id 
      }, correlationId);
      throw error;
    }
  }

  /**
   * Normalize single recipient (first element of array)
   * @private
   * @param {*} recipients - Recipient(s)
   * @returns {string}
   */
  _normalizeRecipient(recipients) {
    if (Array.isArray(recipients) && recipients.length > 0) {
      return recipients[0];
    }
    return recipients || '';
  }

  /**
   * Normalize recipients array
   * @private
   * @param {*} recipients - Recipient(s)
   * @returns {Array}
   */
  _normalizeRecipients(recipients) {
    if (Array.isArray(recipients)) {
      return recipients;
    }
    return recipients ? [recipients] : [];
  }

  /**
   * Disconnect Kafka producer
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      if (this.kafkaProducer) {
        await this.kafkaProducer.disconnect();
      }
    } catch (error) {
      console.error(
        '[ERROR] Error disconnecting Email Publisher:',
        error.message,
      );
    }
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create EmailPublisherService instance
 * @returns {EmailPublisherService}
 */
function getInstance() {
  if (!instance) {
    instance = new EmailPublisherService();
  }
  return instance;
}

module.exports = EmailPublisherService;
module.exports.getInstance = getInstance;
