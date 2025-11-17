# Sistema de Logging y Trazabilidad en Arquitectura de Microservicios

## Descripción General

Este sistema implementa logging completo con trazabilidad end-to-end mediante **Correlation IDs**, permitiendo rastrear cada operación desde el frontend hasta múltiples microservicios.

## Arquitectura de Microservicios

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│              (Genera o recibe x-correlation-id)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP Request + x-correlation-id
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│             MICROSERVICIO PRINCIPAL (Este Repo)                  │
│  - Gestión de quejas                                             │
│  - Middleware de Correlation ID                                  │
│  - Logging centralizado (Winston)                                │
└──────────┬──────────────────────────┬────────────────────────────┘
           │                          │
           │ HTTP + correlation-id    │ HTTP + correlation-id
           ▼                          ▼
┌──────────────────────┐    ┌──────────────────────────┐
│  MICROSERVICIO       │    │  MICROSERVICIO           │
│  EVENT SOURCING      │    │  EMAIL                   │
│  - Historial eventos │    │  - Producer/Consumer     │
│  - Auditoría         │    │  - Envío de correos      │
└──────────────────────┘    └──────────────────────────┘
```

## Componentes en Este Repositorio (Microservicio Principal)

### 1. Logger Centralizado (`src/utils/logger.js`)

Basado en **Winston** con:
- Logs estructurados en formato JSON
- Rotación automática de archivos diarios
- Diferentes niveles: `info`, `warn`, `error`
- Funciones especializadas para diferentes tipos de eventos

#### Funciones disponibles:

```javascript
const { 
    logger,
    logWithContext,
    logEvent,
    logError,
    logDatabaseOperation,
    logMessageQueue,
    logEventSourcing 
} = require('./utils/logger');
```

### 2. Middleware de Correlation ID (`src/middlewares/correlationId.js`)

- Genera o extrae `x-correlation-id` de cada request HTTP
- Propaga el ID a través de toda la aplicación
- Loguea requests entrantes y responses salientes
- Retorna el correlation ID al cliente en el response header

### 3. Cliente HTTP para Event Sourcing (`src/repositories/complaintEventRepository.js`)

- Envía eventos al microservicio de Event Sourcing mediante HTTP
- Propaga correlation IDs en headers
- Logging de comunicación inter-microservicios
- Manejo de errores sin bloquear operación principal

### 4. Cliente HTTP para Email Service (`src/services/emailQueueService.js`)

- `EmailProducer`: Envía solicitudes de email al microservicio
- Propaga correlation IDs
- Logging de comunicación
- Manejo asíncrono de errores

## Flujo de Trazabilidad en Microservicios

```
Frontend Request
    ↓ (x-correlation-id: abc-123)
Microservicio Principal - Middleware (genera/extrae correlation ID)
    ↓
Microservicio Principal - Controller (usa req.correlationId)
    ↓
Microservicio Principal - Service (propaga correlationId)
    ↓
Microservicio Principal - Repository (loguea operaciones DB)
    ├─────────────────────────────────────┐
    ↓                                     ↓
HTTP Request                        HTTP Request
(header: x-correlation-id)          (header: x-correlation-id)
    ↓                                     ↓
Microservicio Event Sourcing        Microservicio Email
    ↓                                     ↓
- Recibe evento                     - Recibe solicitud email
- Loguea con mismo correlation ID   - Loguea con mismo correlation ID
- Guarda en su BD                   - Procesa en cola (Kafka/RabbitMQ)
- Responde éxito/fallo              - Consumer envía correo
                                    - Loguea resultado
    ↓                                     ↓
Todos los logs en cada microservicio tienen el mismo correlation ID
```

## Estructura de Logs

Cada log incluye:
```json
{
  "message": "Descripción del evento",
  "timestamp": "2025-11-17T10:30:00.000Z",
  "correlationId": "abc-123-def-456",
  "level": "info",
  "context": {
    // Datos específicos del evento
  }
}
```

## Archivos de Log

- `logs/application-YYYY-MM-DD.log` - Logs generales (rotación 14 días)
- `logs/error-YYYY-MM-DD.log` - Solo errores (rotación 30 días)
- Tamaño máximo por archivo: 20MB

## Uso en Controladores

```javascript
exports.someAction = async (req, res) => {
    const correlationId = req.correlationId;
    
    try {
        logEvent('ACTION_STARTED', { userId: req.user.id }, correlationId);
        
        // Tu lógica aquí
        
        logEvent('ACTION_SUCCESS', { result }, correlationId);
        res.json({ success: true, correlationId });
    } catch (error) {
        logError(error, { context: 'someAction' }, correlationId);
        res.status(500).json({ error: error.message, correlationId });
    }
};
```

## Uso en Servicios

```javascript
async function processComplaint(complaintId, correlationId) {
    logDatabaseOperation('UPDATE', 'complaints', { complaintId }, correlationId);
    
    // Operación de DB
    
    logEventSourcing('STATUS_CHANGED', complaintId, eventData, correlationId);
}
```

## Uso con Producer/Consumer

```javascript
// Producer
await emailProducer.produceEmailMessage(emailData, correlationId);

// Consumer (automático)
// El consumer loguea automáticamente cuando recibe y procesa mensajes
```

## Búsqueda de Logs

Para rastrear una operación completa usando el correlation ID:

```bash
# Linux/Mac
grep "abc-123-def-456" logs/application-*.log

# Windows PowerShell
Select-String -Path "logs\application-*.log" -Pattern "abc-123-def-456"
```

## Event Sourcing

Todos los cambios de estado de quejas se guardan en la tabla `complaint_events`:

```sql
SELECT * FROM complaint_events 
WHERE correlation_id = 'abc-123-def-456'
ORDER BY created_at;
```

Esto permite:
- Auditoría completa
- Reconstrucción del estado en cualquier momento
- Análisis de comportamiento del sistema

## Variables de Entorno

```env
LOG_LEVEL=info  # debug, info, warn, error
```

## Instalación

```bash
npm install winston winston-daily-rotate-file uuid
```

## Migración de Base de Datos

Para crear la tabla de eventos:

```bash
npx sequelize-cli db:migrate
```

## Notas Importantes

1. **Siempre propaga el `correlationId`** a través de todas las capas
2. **Incluye context relevante** en cada log para facilitar debugging
3. **No loguees información sensible** (contraseñas, tokens, etc.)
4. **Los archivos de log se rotan automáticamente** para evitar que crezcan indefinidamente
5. **El correlation ID se retorna al cliente** para que pueda reportar problemas específicos

## Troubleshooting

Si los logs no aparecen:
1. Verificar que la carpeta `logs/` exista o tenga permisos de escritura
2. Verificar la variable `LOG_LEVEL` en `.env`
3. Revisar que el middleware esté registrado antes de las rutas

## Ejemplo Frontend

Para incluir correlation ID en requests desde el frontend:

```javascript
// React/Vue/Angular
const correlationId = generateUUID(); // o usar una librería

fetch('/api/complaints/update', {
    headers: {
        'x-correlation-id': correlationId,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
})
.then(response => {
    console.log('Correlation ID:', response.headers.get('x-correlation-id'));
});
```
