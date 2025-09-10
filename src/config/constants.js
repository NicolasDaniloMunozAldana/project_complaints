// Archivo central de constantes para la aplicación

// Códigos de estado HTTP
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  INTERNAL_ERROR: 500,
};

// Puerto por defecto
const DEFAULT_PORT = 3030;

// Base para parseInt
const PARSE_BASE = 10;

// Configuración de Gmail
const GMAIL = {
  MAX_CONNECTIONS: 5,
  MAX_MESSAGES: 100,
};

// Estilos de plantilla de email
const EMAIL_TEMPLATE = {
  MAX_WIDTH: 600,
  PADDING: 20,
  HEADER_FONT_SIZE: 24,
  CONTENT_PADDING: 30,
  DETAIL_ROW_MARGIN_BOTTOM: 15,
  DETAIL_ROW_PADDING: 10,
  DETAIL_ROW_BORDER_LEFT: 4,
  LABEL_MIN_WIDTH: 120,
};

module.exports = {
  HTTP_STATUS,
  DEFAULT_PORT,
  PARSE_BASE,
  GMAIL,
  EMAIL_TEMPLATE,
};
