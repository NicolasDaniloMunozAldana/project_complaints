/**
 * Email Helper Utilities
 * Utility functions for email-related operations
 */

const { EMAIL_CONFIG } = require('../config/constants');

/**
 * Parse email recipients from environment variable
 * @param {string} envVar - Environment variable name
 * @returns {Array<string>} Array of email addresses
 */
function parseEmailRecipients(envVar) {
  if (!envVar) {
    return [];
  }
  return envVar
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

/**
 * Get email recipients from environment variables
 * @returns {Object} Object with recipients and ccRecipients arrays
 */
function getEmailRecipientsFromEnv() {
  return {
    recipients: parseEmailRecipients(process.env.EMAIL_RECIPIENTS),
    ccRecipients: parseEmailRecipients(process.env.EMAIL_CC_RECIPIENTS),
  };
}

/**
 * Prepare complaint data for email notification
 * @param {Object} complaint - Complaint object from database
 * @param {string} status - Optional status override
 * @returns {Object} Formatted complaint data
 */
function prepareComplaintData(complaint, status = null) {
  return {
    id: complaint.id_complaint,
    description: complaint.description,
    status: status || complaint.complaint_status,
    entityName: complaint.Entity ? complaint.Entity.name : EMAIL_CONFIG.UNKNOWN_ENTITY,
    createdAt: complaint.created_at,
  };
}

module.exports = {
  parseEmailRecipients,
  getEmailRecipientsFromEnv,
  prepareComplaintData,
};
