# Guía Completa de Trazabilidad entre Microservicios

## Resumen Ejecutivo

Este documento explica cómo implementar trazabilidad completa en una arquitectura de microservicios usando **Correlation IDs** y logging centralizado.

## Arquitectura

```
┌──────────────┐
│   FRONTEND   │
└──────┬───────┘
       │ x-correlation-id: abc-123
       ↓
┌──────────────────────────────────┐
│  MICROSERVICIO PRINCIPAL         │
│  (Este repositorio)              │
│  - Gestión de quejas             │
│  - Genera/extrae correlation ID  │
│  - Logs: application-*.log       │
└────┬─────────────────┬───────────┘
     │                 │
     │ HTTP Request    │ HTTP Request
     │ + correlation   │ + correlation
     ↓                 ↓
┌─────────────┐   ┌──────────────┐
│ EVENT       │   │ EMAIL        │
│ SOURCING    │   │ SERVICE      │
│ - Eventos   │   │ - Correos    │
│ - Logs      │   │ - Cola       │
└─────────────┘   └──────────────┘
```

## ¿Qué Hacer en Cada Repositorio?

### 1. Microservicio Principal (Este Repo)

✅ **Ya implementado:**
- Logger centralizado con Winston
- Middleware de correlation ID
- Clientes HTTP para comunicación con otros servicios
- Propagación de correlation IDs

📝 **Pasos adicionales:**

1. **Instalar dependencias:**
```bash
npm install winston winston-daily-rotate-file uuid axios
```

2. **Agregar variables de entorno** (`.env`):
```env
EVENT_SOURCING_SERVICE_URL=http://localhost:3001
EMAIL_SERVICE_URL=http://localhost:3002
LOG_LEVEL=info
```

3. **Usar en tus controladores:**
```javascript
const correlationId = req.correlationId; // Del middleware

// Enviar evento
const eventRepo = new ComplaintEventRepository();
await eventRepo.saveEvent(eventData, correlationId);

// Enviar email
const emailProducer = new EmailProducer();
await emailProducer.produceEmailMessage(emailData, correlationId);
```

### 2. Microservicio de Event Sourcing

📖 **Ver documento:** `MICROSERVICE_EVENT_SOURCING.md`

**Pasos:**

1. Crear nuevo repositorio/proyecto Node.js
2. Copiar archivos:
   - `src/utils/logger.js` (del repo principal)
   - `src/middlewares/correlationId.js` (del repo principal)
3. Instalar dependencias
4. Crear migración para tabla `complaint_events`
5. Implementar endpoints:
   - `POST /api/events` - Guardar evento
   - `GET /api/events/:type/:id` - Obtener historial
6. Ejecutar servicio en puerto 3001

### 3. Microservicio de Email

📖 **Ver documento:** `MICROSERVICE_EMAIL.md`

**Pasos:**

1. Crear nuevo repositorio/proyecto Node.js
2. Copiar archivos:
   - `src/utils/logger.js` (del repo principal)
   - `src/middlewares/correlationId.js` (del repo principal)
3. Instalar dependencias (incluyendo sistema de colas)
4. Configurar producer/consumer (Kafka, RabbitMQ, etc.)
5. Implementar endpoint:
   - `POST /api/emails/send` - Encolar email
6. Iniciar consumer para procesar cola
7. Ejecutar servicio en puerto 3002

## Flujo Completo de Trazabilidad

### Ejemplo: Cambio de Estado de Queja

#### 1. Frontend hace request:
```javascript
fetch('/complaints/update-status', {
    headers: {
        'x-correlation-id': 'abc-123-def-456',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        id_complaint: 5,
        status: 'cerrada'
    })
});
```

#### 2. Microservicio Principal:

**Logs generados:**
```
[INFO] Incoming Request - correlationId: abc-123-def-456, path: /complaints/update-status
[INFO] UPDATE_COMPLAINT_STATUS_STARTED - complaintId: 5, correlationId: abc-123-def-456
[INFO] DB Operation: UPDATE on complaints - correlationId: abc-123-def-456
```

**Llama a otros servicios:**
- HTTP POST a Event Sourcing
- HTTP POST a Email Service

#### 3. Microservicio Event Sourcing:

**Logs generados:**
```
[INFO] Incoming Request - correlationId: abc-123-def-456, path: /api/events
[INFO] SAVE_EVENT_STARTED - aggregateId: 5, correlationId: abc-123-def-456
[INFO] DB Operation: INSERT on complaint_events - correlationId: abc-123-def-456
[INFO] Event Sourcing: STATUS_CHANGED - correlationId: abc-123-def-456
```

#### 4. Microservicio Email:

**Logs generados:**
```
[INFO] Incoming Request - correlationId: abc-123-def-456, path: /api/emails/send
[INFO] EMAIL_REQUEST_RECEIVED - to: admin@example.com, correlationId: abc-123-def-456
[INFO] Queue PRODUCED: EMAIL_SEND - correlationId: abc-123-def-456
[INFO] Queue CONSUMED: EMAIL_SEND - correlationId: abc-123-def-456
[INFO] EMAIL_SENT_SUCCESS - messageId: <xyz@mail>, correlationId: abc-123-def-456
```

## Buscar Logs de una Operación Específica

### En cada microservicio:

```bash
# Linux/Mac
grep "abc-123-def-456" logs/application-*.log

# Windows PowerShell
Select-String -Path "logs\application-*.log" -Pattern "abc-123-def-456"
```

### Resultado esperado:

Verás todos los logs de los 3 microservicios con el mismo `correlationId`, permitiendo rastrear toda la operación end-to-end.

## Ventajas de Esta Arquitectura

✅ **Trazabilidad completa** - Un solo ID rastrea toda la operación  
✅ **Debugging fácil** - Busca por correlation ID y encuentra todos los logs  
✅ **Auditoría** - Event Sourcing guarda historial completo  
✅ **Desacoplamiento** - Microservicios independientes  
✅ **Resiliencia** - Si un servicio falla, no afecta al principal  
✅ **Escalabilidad** - Cada servicio puede escalar independientemente  

## Checklist de Implementación

### Microservicio Principal ✅
- [x] Logger configurado
- [x] Middleware de correlation ID
- [x] Clientes HTTP para otros servicios
- [x] Propagación de correlation IDs
- [ ] Instalar dependencias adicionales
- [ ] Configurar URLs de servicios en .env

### Microservicio Event Sourcing ⚠️
- [ ] Crear nuevo proyecto
- [ ] Copiar logger y middleware
- [ ] Crear migración de BD
- [ ] Implementar endpoints
- [ ] Configurar y ejecutar

### Microservicio Email ⚠️
- [ ] Crear nuevo proyecto
- [ ] Copiar logger y middleware
- [ ] Configurar sistema de colas
- [ ] Implementar producer/consumer
- [ ] Configurar SMTP
- [ ] Ejecutar servicio

## Próximos Pasos

1. **Revisar este documento y los específicos de cada microservicio**
2. **Implementar cada microservicio según su guía**
3. **Probar el flujo completo:**
   - Hacer una operación desde el frontend
   - Verificar que el correlation ID se propague
   - Buscar logs en los 3 servicios con el mismo ID
4. **Monitorear y ajustar según necesidad**

## Soporte

Si tienes preguntas sobre la implementación:
- Revisa los documentos específicos de cada microservicio
- Verifica que los correlation IDs se estén propagando correctamente
- Asegúrate de que todos los servicios estén usando el mismo logger
