# 📧 Arquitectura de Email Desacoplada

## 🎯 Descripción

Esta implementación refactoriza el sistema de envío de correos electrónicos usando principios de **Clean Architecture** y **SOLID**, proporcionando un diseño desacoplado, extensible y fácil de mantener.

## 🏗️ Arquitectura

```
src/
├── interfaces/
│   └── IEmailService.js          # Interfaz que define el contrato
├── services/
│   ├── EmailServiceFactory.js    # Factory pattern + Singleton
│   └── GmailEmailService.js      # Implementación para Gmail
└── utils/
    └── emailService.js           # Capa de compatibilidad
```

## 🔧 Componentes Principales

### 1. **IEmailService** (Interfaz)
Define el contrato que deben cumplir todos los proveedores de email:
- `createTransporter()`
- `generateEmailTemplate(data)`
- `sendNotificationEmail(req, action)`
- `validateConfiguration()`

### 2. **GmailEmailService** (Implementación)
Implementación específica para Gmail con:
- ✅ Validación de credenciales
- ✅ Pool de conexiones para mejor rendimiento
- ✅ Plantilla HTML mejorada con diseño responsivo
- ✅ Manejo robusto de errores
- ✅ Método para correos de prueba

### 3. **EmailServiceFactory** (Factory + Singleton)
- 🏭 **Factory Pattern**: Crea instancias según el proveedor
- 🔄 **Singleton Pattern**: Una sola instancia por aplicación
- 🔧 **Configuración centralizada**
- 📋 **Validación de proveedores soportados**

### 4. **emailService.js** (Compatibilidad)
Mantiene la interfaz original mientras usa la nueva arquitectura internamente.

## 🚀 Uso

### Uso Básico (Nuevo)
```javascript
const EmailServiceFactory = require('./src/services/EmailServiceFactory');

// Configurar servicio
const emailService = EmailServiceFactory.configure('gmail');

// Enviar notificación
await emailService.sendNotificationEmail(req, 'Acción realizada');

// Enviar correo de prueba
await emailService.sendTestEmail('test@example.com');
```

### Uso Existente (Compatibilidad)
```javascript
const { sendNotificationEmail } = require('./src/utils/emailService');

// Funciona igual que antes
await sendNotificationEmail(req, 'Acción realizada');
```

## 🔌 Extensibilidad

Para agregar un nuevo proveedor (ej: Outlook):

1. **Crear implementación**:
```javascript
// src/services/OutlookEmailService.js
class OutlookEmailService extends IEmailService {
  // Implementar métodos requeridos
}
```

2. **Actualizar Factory**:
```javascript
// En EmailServiceFactory.js
case this.EMAIL_PROVIDERS.OUTLOOK:
  return new OutlookEmailService();
```

## ⚙️ Configuración

### Variables de Entorno
```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_PROVIDER=gmail  # Opcional, por defecto: gmail
```

### Proveedores Soportados
- ✅ **Gmail** - Implementado
- 🔄 **Outlook** - Planificado
- 🔄 **SendGrid** - Planificado
- 🔄 **AWS SES** - Planificado

## 🧪 Pruebas

### Ejecutar Demo
```bash
node demo-email-service.js
```

### Probar Manualmente
```javascript
const EmailServiceFactory = require('./src/services/EmailServiceFactory');

async function test() {
  const service = EmailServiceFactory.getInstance();
  await service.sendTestEmail();
}
```

## 📊 Beneficios

### ✅ **Desacoplamiento**
- Fácil cambio entre proveedores
- Independencia de implementaciones específicas

### ✅ **Mantenibilidad**
- Código organizado y modular
- Principios SOLID aplicados

### ✅ **Testabilidad**
- Interfaces bien definidas
- Mocking fácil para testing

### ✅ **Extensibilidad**
- Nuevos proveedores sin modificar código existente
- Patrón Open/Closed principle

### ✅ **Rendimiento**
- Singleton para reutilizar instancias
- Pool de conexiones en Gmail

### ✅ **Compatibilidad**
- Sin cambios en código existente
- Migración gradual posible

## 🔧 Métodos Disponibles

### EmailServiceFactory
```javascript
// Crear servicio específico
EmailServiceFactory.createEmailService('gmail')

// Obtener instancia singleton
EmailServiceFactory.getInstance()

// Verificar proveedor soportado
EmailServiceFactory.isProviderSupported('gmail')

// Obtener proveedores disponibles
EmailServiceFactory.getSupportedProviders()

// Configurar con validaciones
EmailServiceFactory.configure('gmail')
```

### GmailEmailService
```javascript
// Métodos heredados de IEmailService
service.createTransporter()
service.generateEmailTemplate(data)
service.sendNotificationEmail(req, action)
service.validateConfiguration()

// Métodos específicos
service.sendTestEmail(to)
```

## 🛡️ Manejo de Errores

- ✅ Validación de credenciales al inicializar
- ✅ Manejo graceful de errores de envío
- ✅ Logs detallados con emojis para fácil identificación
- ✅ No afecta la funcionalidad principal si falla el email

## 📝 Logging

El sistema incluye logging mejorado:
- ✅ `✅ Correo enviado correctamente`
- ❌ `❌ Error al enviar correo`
- ⚠️ `⚠️ Función deprecated`
- 🔄 `🔄 Servicio reiniciado`

## 🔮 Roadmap

1. **Fase 1** ✅ - Implementación básica con Gmail
2. **Fase 2** 🔄 - Agregar soporte para Outlook
3. **Fase 3** 🔄 - Implementar SendGrid
4. **Fase 4** 🔄 - Soporte para AWS SES
5. **Fase 5** 🔄 - Dashboard de configuración
6. **Fase 6** 🔄 - Tests automatizados completos
