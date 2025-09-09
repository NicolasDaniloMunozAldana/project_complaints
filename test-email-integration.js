// ============================================================================
// SCRIPT DE PRUEBA DE INTEGRACIÓN
// ============================================================================
// Prueba la integración completa de la nueva arquitectura de email

const axios = require('axios');

const BASE_URL = 'http://localhost:3030';

/**
 * Función para probar las rutas que disparan emails
 */
async function testEmailIntegration() {
  console.log('🧪 Iniciando pruebas de integración de email...\n');

  try {
    // ========================================================================
    // 1. Probar ruta de listado de quejas
    // ========================================================================
    console.log('📋 Probando ruta de listado de quejas...');
    const listResponse = await axios.get(`${BASE_URL}/complaints/list`);
    
    if (listResponse.status === 200) {
      console.log('✅ Ruta /complaints/list funcionando correctamente');
      console.log('📧 Esta ruta debería haber enviado un email de notificación');
    } else {
      console.log('❌ Error en ruta /complaints/list:', listResponse.status);
    }
    console.log('');

    // Esperar un poco antes de la siguiente prueba
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ========================================================================
    // 2. Probar ruta de estadísticas
    // ========================================================================
    console.log('📊 Probando ruta de estadísticas...');
    const statsResponse = await axios.get(`${BASE_URL}/complaints/stats`);
    
    if (statsResponse.status === 200) {
      console.log('✅ Ruta /complaints/stats funcionando correctamente');
      console.log('📧 Esta ruta debería haber enviado un email de notificación');
    } else {
      console.log('❌ Error en ruta /complaints/stats:', statsResponse.status);
    }
    console.log('');

    // ========================================================================
    // 3. Probar ruta principal (no debería enviar email)
    // ========================================================================
    console.log('🏠 Probando ruta principal...');
    const homeResponse = await axios.get(`${BASE_URL}/`);
    
    if (homeResponse.status === 200) {
      console.log('✅ Ruta principal funcionando correctamente');
      console.log('📧 Esta ruta NO debería enviar email (correcto)');
    } else {
      console.log('❌ Error en ruta principal:', homeResponse.status);
    }
    console.log('');

    console.log('🎉 Pruebas de integración completadas!');
    console.log('🔍 Revisa los logs del servidor para confirmar que se enviaron los emails.');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Asegúrate de que el servidor esté ejecutándose en http://localhost:3030');
    }
  }
}

/**
 * Función para mostrar información de las pruebas
 */
function showTestInfo() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                          PRUEBAS DE INTEGRACIÓN                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║ 🎯 OBJETIVO:                                                                 ║
║   Verificar que la nueva arquitectura de email funcione correctamente       ║
║   en el contexto de la aplicación completa.                                 ║
║                                                                              ║
║ 🧪 RUTAS A PROBAR:                                                           ║
║   ✅ GET /complaints/list    → Debe enviar email de notificación            ║
║   ✅ GET /complaints/stats   → Debe enviar email de notificación            ║
║   ✅ GET /                   → NO debe enviar email                         ║
║                                                                              ║
║ 📧 EMAILS ESPERADOS:                                                         ║
║   • "Listado de Quejas Solicitado"                                          ║
║   • "Estadísticas de Quejas Solicitadas"                                    ║
║                                                                              ║
║ 📋 DESTINATARIOS:                                                            ║
║   • TO: munozaldananicolasdanilo@gmail.com                                   ║
║   • CC: quejas.entidadesboyaca@gmail.com                                     ║
║                                                                              ║
║ ⚠️  REQUISITOS:                                                              ║
║   • Servidor ejecutándose en puerto 3030                                    ║
║   • Base de datos configurada                                               ║
║   • Credenciales de email válidas                                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  showTestInfo();
  testEmailIntegration();
}

module.exports = { testEmailIntegration, showTestInfo };
