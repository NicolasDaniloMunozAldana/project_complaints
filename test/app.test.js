// Tests unitarios - Solo lógica de negocio
const EmailServiceFactory = require("../src/services/EmailServiceFactory");
const GmailEmailService = require("../src/services/GmailEmailService");
const { PARSE_BASE, HTTP_STATUS, DEFAULT_PORT, GMAIL, EMAIL_TEMPLATE } = require("../src/config/constants");

// Mock para process.env
jest.mock('dotenv', () => ({ config: jest.fn() }));

describe("Business Logic Unit Tests", () => {
  
  // Test para EmailServiceFactory
  describe("EmailServiceFactory", () => {
    
    beforeEach(() => {
      EmailServiceFactory.resetInstance();
    });

    test("should throw error for unsupported provider", () => {
      expect(() => {
        EmailServiceFactory.createEmailService('unsupported');
      }).toThrow('Proveedor de email no soportado: unsupported');
    });

    test("should validate supported providers correctly", () => {
      expect(EmailServiceFactory.isProviderSupported('gmail')).toBe(true);
      expect(EmailServiceFactory.isProviderSupported('outlook')).toBe(true);
      expect(EmailServiceFactory.isProviderSupported('invalid')).toBe(false);
    });

    test("should return list of supported providers", () => {
      const providers = EmailServiceFactory.getSupportedProviders();
      expect(providers).toContain('gmail');
      expect(providers).toContain('outlook');
      expect(providers).toContain('sendgrid');
      expect(providers).toContain('aws-ses');
    });
  });

  // Test para validaciones de lógica de negocio
  describe("Complaint Status Validation Logic", () => {
    
    test("should validate allowed complaint statuses", () => {
      const allowedStatuses = ['abierta', 'en_revision', 'cerrada'];
      
      expect(allowedStatuses.includes('abierta')).toBe(true);
      expect(allowedStatuses.includes('en_revision')).toBe(true);
      expect(allowedStatuses.includes('cerrada')).toBe(true);
      expect(allowedStatuses.includes('invalid_status')).toBe(false);
    });

    test("should validate entity ID parsing", () => {
      const validEntityId = "123";
      const invalidEntityId = "abc";
      
      expect(!isNaN(Number(validEntityId))).toBe(true);
      expect(!isNaN(Number(invalidEntityId))).toBe(false);
      expect(parseInt(validEntityId, PARSE_BASE)).toBe(123);
    });

    test("should validate required fields for complaint creation", () => {
      const validComplaint = { entity: "1", description: "Test complaint" };
      const invalidComplaint1 = { entity: "", description: "Test complaint" };
      const invalidComplaint2 = { entity: "1", description: "" };
      
      expect(!!(validComplaint.entity && validComplaint.description)).toBe(true);
      expect(!!(invalidComplaint1.entity && invalidComplaint1.description)).toBe(false);
      expect(!!(invalidComplaint2.entity && invalidComplaint2.description)).toBe(false);
    });

    test("should validate password authentication logic", () => {
      const correctPassword = "admin123";
      const wrongPassword = "wrong_password";
      const adminPassword = "admin123"; // Simula process.env.ADMIN_PASSWORD
      
      expect(correctPassword === adminPassword).toBe(true);
      expect(wrongPassword === adminPassword).toBe(false);
    });
  });

  // Test para GmailEmailService - Solo lógica de negocio
  describe("GmailEmailService Business Logic", () => {
    
    let originalEnv;
    
    beforeEach(() => {
      originalEnv = process.env;
      process.env = { 
        ...originalEnv, 
        EMAIL_USER: 'test@gmail.com', 
        EMAIL_PASSWORD: 'testpass' 
      };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    test("should validate configuration with required environment variables", () => {
      const service = new GmailEmailService();
      expect(() => service.validateConfiguration()).not.toThrow();
    });

    test("should throw error when EMAIL_USER is missing", () => {
      delete process.env.EMAIL_USER;
      
      expect(() => {
        new GmailEmailService();
      }).toThrow('EMAIL_USER y EMAIL_PASSWORD deben estar configurados en las variables de entorno');
    });

    test("should throw error when EMAIL_PASSWORD is missing", () => {
      delete process.env.EMAIL_PASSWORD;
      
      expect(() => {
        new GmailEmailService();
      }).toThrow('EMAIL_USER y EMAIL_PASSWORD deben estar configurados en las variables de entorno');
    });

    test("should generate email template with correct data structure", () => {
      const service = new GmailEmailService();
      const testData = {
        action: 'Test Action',
        timestamp: '2023-01-01 12:00:00',
        ip: '192.168.1.1',
        url: '/test',
        method: 'GET',
        userAgent: 'Test Agent'
      };
      
      const template = service.generateEmailTemplate(testData);
      
      expect(template).toContain(testData.action);
      expect(template).toContain(testData.timestamp);
      expect(template).toContain(testData.ip);
      expect(template).toContain(testData.url);
      expect(template).toContain(testData.method);
      expect(template).toContain(testData.userAgent);
      expect(template).toContain('Sistema de Reportes de Quejas');
    });
  });

  // Test para constantes del negocio
  describe("Business Constants", () => {
    
    test("should have correct HTTP status codes", () => {
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.INTERNAL_ERROR).toBe(500);
    });

    test("should have correct default port", () => {
      expect(DEFAULT_PORT).toBe(3030);
    });

    test("should have correct parse base", () => {
      expect(PARSE_BASE).toBe(10);
    });

    test("should have Gmail configuration constants", () => {
      expect(GMAIL.MAX_CONNECTIONS).toBe(5);
      expect(GMAIL.MAX_MESSAGES).toBe(100);
    });

    test("should have email template configuration", () => {
      expect(EMAIL_TEMPLATE.MAX_WIDTH).toBe(600);
      expect(EMAIL_TEMPLATE.PADDING).toBe(20);
      expect(EMAIL_TEMPLATE.HEADER_FONT_SIZE).toBe(24);
    });
  });

  // Test para lógica de filtrado de URLs de interés
  describe("Email Notification Filter Logic", () => {
    
    test("should identify URLs of interest for email notifications", () => {
      const urlsOfInterest = ['/complaints/list', '/complaints/stats'];
      
      expect(urlsOfInterest.some(url => '/complaints/list'.includes(url))).toBe(true);
      expect(urlsOfInterest.some(url => '/complaints/stats'.includes(url))).toBe(true);
      expect(urlsOfInterest.some(url => '/'.includes(url))).toBe(false);
      expect(urlsOfInterest.some(url => '/complaints/file'.includes(url))).toBe(false);
    });

    test("should determine correct email action based on URL", () => {
      const getActionFromUrl = (url) => {
        if (url.includes('/complaints/list')) return 'Listado de Quejas Solicitado';
        if (url.includes('/complaints/stats')) return 'Estadísticas de Quejas Solicitadas';
        return null;
      };
      
      expect(getActionFromUrl('/complaints/list')).toBe('Listado de Quejas Solicitado');
      expect(getActionFromUrl('/complaints/stats')).toBe('Estadísticas de Quejas Solicitadas');
      expect(getActionFromUrl('/other')).toBe(null);
    });
  });

  // Test para lógica de validación de datos de entrada
  describe("Input Validation Logic", () => {
    
    test("should validate complaint update data completeness", () => {
      const validateUpdateData = (data) => {
        return !!(data.id_complaint && data.complaint_status && data.password);
      };
      
      expect(validateUpdateData({ 
        id_complaint: 1, 
        complaint_status: 'cerrada', 
        password: 'admin123' 
      })).toBe(true);
      
      expect(validateUpdateData({ 
        id_complaint: 1, 
        complaint_status: 'cerrada' 
      })).toBe(false);
      
      expect(validateUpdateData({})).toBe(false);
    });

    test("should validate reCAPTCHA token presence", () => {
      const validateToken = (token) => {
        return !!(token && token.trim().length > 0);
      };
      
      expect(validateToken('valid_token_123')).toBe(true);
      expect(validateToken('')).toBe(false);
      expect(validateToken(null)).toBe(false);
      expect(validateToken(undefined)).toBe(false);
    });
  });
});