// Archivo central de constantes para la aplicación

// Códigos de estado HTTP
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  INTERNAL_ERROR: 500,
};

// Puerto por defecto
const DEFAULT_PORT = 3030;

// URL del servicio de autenticación
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4000';

// Base para parseInt
const PARSE_BASE = 10;

// Email Configuration Constants
const EMAIL_CONFIG = {
  DEFAULT_FROM_NAME: process.env.EMAIL_FROM_NAME || 'Sistema de Gestión de Quejas',
  DEFAULT_SOURCE: 'complaints-service',
  DEFAULT_PRIORITY: 'normal',
  HIGH_PRIORITY: 'high',
  DEFAULT_SUBJECT: 'Notificación',
  UNKNOWN_ENTITY: 'Entidad desconocida',
};

// Email Event Types
const EMAIL_EVENT_TYPES = {
  NOTIFICATION: 'email.notification',
  COMPLAINT_CREATED: 'complaint.created',
  COMPLAINT_UPDATED: 'complaint.updated',
};

// Email Action Messages
const EMAIL_ACTIONS = {
  COMPLAINT_CREATED: 'Nueva queja registrada',
  COMPLAINT_UPDATED: (status) => `Queja actualizada a: ${status}`,
};

// Email Subject Templates
const EMAIL_SUBJECTS = {
  COMPLAINT_NOTIFICATION: (complaintId) => `Notificación de Queja #${complaintId}`,
  COMPLAINT_UPDATE: (complaintId) => `Actualización de Queja #${complaintId}`,
};

// Email Title Templates
const EMAIL_TITLES = {
  COMPLAINT_NOTIFICATION: (complaintId, entityName) =>
    `Queja #${complaintId} - ${entityName || EMAIL_CONFIG.UNKNOWN_ENTITY}`,
  COMPLAINT_UPDATE: (complaintId) => `Queja #${complaintId} Actualizada`,
};

module.exports = {
  HTTP_STATUS,
  DEFAULT_PORT,
  PARSE_BASE,
  AUTH_SERVICE_URL,
  EMAIL_CONFIG,
  EMAIL_EVENT_TYPES,
  EMAIL_ACTIONS,
  EMAIL_SUBJECTS,
  EMAIL_TITLES,
};
