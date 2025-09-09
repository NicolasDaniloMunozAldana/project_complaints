const GmailEmailService = require('./GmailEmailService');

/**
 * Factory para crear instancias de servicios de email
 * Permite cambiar fácilmente entre diferentes proveedores
 */
class EmailServiceFactory {
  /**
   * Tipos de servicios de email soportados
   */
  static EMAIL_PROVIDERS = {
    GMAIL: 'gmail',
    OUTLOOK: 'outlook',
    SENDGRID: 'sendgrid',
    AWS_SES: 'aws-ses'
  };

  /**
   * Instancia única del servicio (Singleton)
   */
  static instance = null;

  /**
   * Crea una instancia del servicio de email según el proveedor especificado
   * @param {string} provider - Tipo de proveedor (gmail, outlook, etc.)
   * @returns {IEmailService} Instancia del servicio de email
   */
  static createEmailService(provider = null) {
    // Si no se especifica proveedor, usar el de las variables de entorno o Gmail por defecto
    const selectedProvider = provider || process.env.EMAIL_PROVIDER || this.EMAIL_PROVIDERS.GMAIL;

    switch (selectedProvider.toLowerCase()) {
      case this.EMAIL_PROVIDERS.GMAIL:
        return new GmailEmailService();
      
      case this.EMAIL_PROVIDERS.OUTLOOK:
        // Aquí se podría implementar OutlookEmailService
        throw new Error('Outlook Email Service no implementado aún');
      
      case this.EMAIL_PROVIDERS.SENDGRID:
        // Aquí se podría implementar SendGridEmailService
        throw new Error('SendGrid Email Service no implementado aún');
      
      case this.EMAIL_PROVIDERS.AWS_SES:
        // Aquí se podría implementar AWSEmailService
        throw new Error('AWS SES Email Service no implementado aún');
      
      default:
        throw new Error(`Proveedor de email no soportado: ${selectedProvider}`);
    }
  }

  /**
   * Obtiene una instancia singleton del servicio de email
   * @param {string} provider - Tipo de proveedor
   * @returns {IEmailService} Instancia única del servicio
   */
  static getInstance(provider = null) {
    if (!this.instance) {
      this.instance = this.createEmailService(provider);
    }
    return this.instance;
  }

  /**
   * Resetea la instancia singleton (útil para testing)
   */
  static resetInstance() {
    this.instance = null;
  }

  /**
   * Valida que el proveedor especificado esté soportado
   * @param {string} provider - Proveedor a validar
   * @returns {boolean} True si está soportado
   */
  static isProviderSupported(provider) {
    return Object.values(this.EMAIL_PROVIDERS).includes(provider.toLowerCase());
  }

  /**
   * Obtiene la lista de proveedores soportados
   * @returns {Array<string>} Lista de proveedores
   */
  static getSupportedProviders() {
    return Object.values(this.EMAIL_PROVIDERS);
  }

  /**
   * Configura el servicio de email con validaciones
   * @param {string} provider - Proveedor a usar
   * @returns {IEmailService} Servicio configurado
   */
  static configure(provider = null) {
    try {
      const service = this.createEmailService(provider);
      
      // Validar configuración
      if (service.validateConfiguration()) {
        console.log(`✅ Servicio de email configurado correctamente: ${provider || 'Gmail'}`);
        return service;
      }
    } catch (error) {
      console.error(`❌ Error configurando servicio de email: ${error.message}`);
      throw error;
    }
  }
}

module.exports = EmailServiceFactory;
