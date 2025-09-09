// ============================================================================
// SCRIPT DE DEMOSTRACIÓN DEL SERVICIO DE EMAIL DESACOPLADO
// ============================================================================
// Este script demuestra cómo usar la nueva arquitectura de servicios de email

require('dotenv').config();
const EmailServiceFactory = require('./src/services/EmailServiceFactory');

/**
 * Función principal de demostración
 */
async function demonstrateEmailService() {
  console.log('🚀 Iniciando demostración del servicio de email desacoplado\n');

  try {
    // ========================================================================
    // 1. Mostrar proveedores disponibles
    // ========================================================================
    console.log('📋 Proveedores soportados:', EmailServiceFactory.getSupportedProviders());
    console.log('✅ Gmail está soportado:', EmailServiceFactory.isProviderSupported('gmail'));
    console.log('❌ Outlook está soportado:', EmailServiceFactory.isProviderSupported('outlook'));
    console.log('');

    // ========================================================================
    // 2. Configurar el servicio usando el factory
    // ========================================================================
    console.log('⚙️ Configurando servicio de email...');
    const emailService = EmailServiceFactory.configure('gmail');
    console.log('');

    // ========================================================================
    // 3. Validar configuración
    // ========================================================================
    console.log('🔍 Validando configuración...');
    const isValid = emailService.validateConfiguration();
    console.log('Configuración válida:', isValid ? '✅' : '❌');
    console.log('');

    // ========================================================================
    // 4. Demostrar uso directo del servicio
    // ========================================================================
    console.log('📧 Enviando correo de prueba...');
    
    // Simular un objeto request de Express
    const mockRequest = {
      originalUrl: '/complaints/list',
      ip: '192.168.1.100',
      method: 'GET',
      get: (header) => {
        if (header === 'User-Agent') {
          return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0';
        }
        return undefined;
      }
    };

    // Enviar notificación de prueba
    await emailService.sendNotificationEmail(mockRequest, 'Prueba de Arquitectura Desacoplada');
    console.log('✅ Correo de notificación enviado correctamente\n');

    // ========================================================================
    // 5. Enviar correo de prueba directo
    // ========================================================================
    console.log('🧪 Enviando correo de prueba directo...');
    const testResult = await emailService.sendTestEmail();
    console.log('✅ Correo de prueba enviado:', testResult.messageId);
    console.log('');

    // ========================================================================
    // 6. Demostrar patrón Singleton
    // ========================================================================
    console.log('🔄 Demostrando patrón Singleton...');
    const instance1 = EmailServiceFactory.getInstance();
    const instance2 = EmailServiceFactory.getInstance();
    console.log('Las instancias son la misma:', instance1 === instance2 ? '✅' : '❌');
    console.log('');

    // ========================================================================
    // 7. Demostrar compatibilidad con código existente
    // ========================================================================
    console.log('🔌 Demostrando compatibilidad con código existente...');
    const { sendNotificationEmail } = require('./src/utils/emailService');
    
    await sendNotificationEmail(mockRequest, 'Prueba de Compatibilidad');
    console.log('✅ Funciona con la interfaz original\n');

    console.log('🎉 ¡Demostración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error en la demostración:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Función para mostrar información sobre la arquitectura
 */
function showArchitectureInfo() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                      ARQUITECTURA DE EMAIL DESACOPLADA                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║ 📁 src/interfaces/                                                           ║
║   └── IEmailService.js          ← Interfaz que define el contrato           ║
║                                                                              ║
║ 📁 src/services/                                                             ║
║   ├── EmailServiceFactory.js    ← Factory pattern + Singleton               ║
║   └── GmailEmailService.js      ← Implementación específica para Gmail      ║
║                                                                              ║
║ 📁 src/utils/                                                                ║
║   └── emailService.js           ← Capa de compatibilidad                    ║
║                                                                              ║
║ 🔧 BENEFICIOS:                                                               ║
║   ✅ Fácil cambio entre proveedores de email                                ║
║   ✅ Código más testeable y mantenible                                       ║
║   ✅ Principios SOLID aplicados                                              ║
║   ✅ Patrón Singleton para eficiencia                                        ║
║   ✅ Compatibilidad con código existente                                     ║
║                                                                              ║
║ 🚀 FUTURAS EXTENSIONES:                                                      ║
║   • OutlookEmailService                                                      ║
║   • SendGridEmailService                                                     ║
║   • AWSEmailService                                                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  showArchitectureInfo();
  demonstrateEmailService();
}

module.exports = { demonstrateEmailService, showArchitectureInfo };
