# Diagrama de Flujo de Trazabilidad

## Arquitectura Completa

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 FRONTEND                                         │
│                  (Browser - React/Vue/Vanilla JS)                               │
│                                                                                   │
│  const correlationId = generateUUID();                                           │
│  fetch('/api/complaints/update', {                                               │
│    headers: { 'x-correlation-id': correlationId }                               │
│  })                                                                              │
└─────────────────────────────────┬───────────────────────────────────────────────┘
                                  │
                                  │ HTTP POST + x-correlation-id: abc-123
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│              MICROSERVICIO PRINCIPAL (Puerto 3030)                               │
│                       project_complaints                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  1. Middleware correlationId.js                                                  │
│     ├─ Extrae x-correlation-id: abc-123                                         │
│     ├─ req.correlationId = 'abc-123'                                            │
│     └─ LOG: "Incoming Request - correlationId: abc-123"                         │
│                                                                                   │
│  2. Controller (complaintsController.js)                                         │
│     ├─ const correlationId = req.correlationId                                  │
│     └─ LOG: "UPDATE_COMPLAINT_STATUS_STARTED - correlationId: abc-123"          │
│                                                                                   │
│  3. Service (complaintService.js)                                                │
│     ├─ Valida datos                                                              │
│     ├─ Actualiza BD local                                                        │
│     └─ LOG: "DB Operation: UPDATE - correlationId: abc-123"                     │
│                                                                                   │
│  4. Repository (complaintEventRepository.js)                                     │
│     ├─ Envía HTTP POST a Event Sourcing                                         │
│     │  headers: { 'x-correlation-id': 'abc-123' }                               │
│     └─ LOG: "EVENT_SENT_TO_SERVICE - correlationId: abc-123"                    │
│                                                                                   │
│  5. Email Service Client (emailQueueService.js)                                  │
│     ├─ Envía HTTP POST a Email Service                                          │
│     │  headers: { 'x-correlation-id': 'abc-123' }                               │
│     └─ LOG: "SENT_TO_SERVICE - correlationId: abc-123"                          │
│                                                                                   │
│  📁 logs/application-2025-11-17.log                                              │
│     [INFO] Incoming Request - correlationId: abc-123                            │
│     [INFO] UPDATE_COMPLAINT_STATUS_STARTED - correlationId: abc-123             │
│     [INFO] DB Operation: UPDATE - correlationId: abc-123                        │
│     [INFO] EVENT_SENT_TO_SERVICE - correlationId: abc-123                       │
│     [INFO] SENT_TO_SERVICE - correlationId: abc-123                             │
│                                                                                   │
└──────────────┬─────────────────────────────────────┬────────────────────────────┘
               │                                     │
               │ HTTP POST                           │ HTTP POST
               │ x-correlation-id: abc-123           │ x-correlation-id: abc-123
               ▼                                     ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────────────┐
│  MICROSERVICIO EVENT SOURCING   │   │  MICROSERVICIO EMAIL                    │
│  (Puerto 3001)                  │   │  (Puerto 3002)                          │
│  project_historical             │   │  project_email_sender                   │
├─────────────────────────────────┤   ├─────────────────────────────────────────┤
│                                 │   │                                         │
│ 1. Middleware correlationId     │   │ 1. Middleware correlationId             │
│    ├─ Extrae abc-123            │   │    ├─ Extrae abc-123                    │
│    └─ LOG: Incoming Request     │   │    └─ LOG: Incoming Request             │
│                                 │   │                                         │
│ 2. Controller eventsController  │   │ 2. Controller emailController           │
│    └─ LOG: SAVE_EVENT_STARTED   │   │    └─ LOG: EMAIL_REQUEST_RECEIVED       │
│                                 │   │                                         │
│ 3. Repository eventsRepository  │   │ 3. Producer emailProducer               │
│    ├─ INSERT en complaint_events│   │    ├─ Agrega mensaje a cola (Kafka)     │
│    └─ LOG: DB INSERT            │   │    └─ LOG: PRODUCED                     │
│                                 │   │                                         │
│ 📁 logs/application-*.log       │   │ 4. Consumer emailConsumer               │
│    [INFO] Incoming - abc-123    │   │    ├─ Consume mensaje de cola           │
│    [INFO] SAVE_EVENT - abc-123  │   │    ├─ LOG: CONSUMED                     │
│    [INFO] DB INSERT - abc-123   │   │    ├─ Envía email via SMTP              │
│                                 │   │    └─ LOG: EMAIL_SENT_SUCCESS           │
│ 💾 DB: complaint_events         │   │                                         │
│    correlation_id: abc-123      │   │ 📁 logs/application-*.log               │
│    event_data: {...}            │   │    [INFO] Incoming - abc-123            │
│    created_at: 2025-11-17...    │   │    [INFO] EMAIL_REQUEST - abc-123       │
│                                 │   │    [INFO] PRODUCED - abc-123            │
└─────────────────────────────────┘   │    [INFO] CONSUMED - abc-123            │
                                      │    [INFO] EMAIL_SENT - abc-123          │
                                      │                                         │
                                      └─────────────────────────────────────────┘
```

## Flujo de Datos Step-by-Step

### Paso 1: Frontend → Microservicio Principal
```
Frontend
  ↓
  Genera/usa correlation ID: "abc-123-def-456"
  ↓
  HTTP POST /complaints/update-status
  Header: x-correlation-id: abc-123-def-456
  Body: { id_complaint: 5, status: "cerrada" }
```

### Paso 2: Microservicio Principal - Processing
```
1. Middleware extrae correlation ID
   req.correlationId = "abc-123-def-456"

2. Controller procesa request
   correlationId = req.correlationId
   
3. Service actualiza queja en BD
   complaintsRepository.updateStatus(5, "cerrada")
   
4. Logs generados:
   [INFO] Incoming Request - abc-123-def-456
   [INFO] UPDATE_COMPLAINT_STATUS_STARTED - abc-123-def-456
   [INFO] DB Operation: UPDATE complaints - abc-123-def-456
```

### Paso 3: Comunicación con Event Sourcing
```
Microservicio Principal
  ↓
  HTTP POST http://localhost:3001/api/events
  Header: x-correlation-id: abc-123-def-456
  Body: {
    aggregateType: "COMPLAINT",
    aggregateId: 5,
    eventType: "STATUS_CHANGED",
    eventData: { oldStatus: "abierta", newStatus: "cerrada" }
  }
  ↓
Event Sourcing Service
  ↓
  Middleware extrae correlation ID
  Controller guarda evento
  Repository INSERT en complaint_events
  ↓
  Logs generados:
  [INFO] Incoming Request - abc-123-def-456
  [INFO] SAVE_EVENT_STARTED - abc-123-def-456
  [INFO] DB INSERT complaint_events - abc-123-def-456
```

### Paso 4: Comunicación con Email Service
```
Microservicio Principal
  ↓
  HTTP POST http://localhost:3002/api/emails/send
  Header: x-correlation-id: abc-123-def-456
  Body: {
    type: "EMAIL_SEND",
    data: {
      to: "admin@example.com",
      subject: "Queja #5 cerrada",
      body: "..."
    }
  }
  ↓
Email Service
  ↓
  Middleware extrae correlation ID
  Controller recibe request
  Producer agrega mensaje a cola (Kafka/RabbitMQ)
  Consumer procesa mensaje
  EmailSender envía correo via SMTP
  ↓
  Logs generados:
  [INFO] Incoming Request - abc-123-def-456
  [INFO] EMAIL_REQUEST_RECEIVED - abc-123-def-456
  [INFO] Queue PRODUCED - abc-123-def-456
  [INFO] Queue CONSUMED - abc-123-def-456
  [INFO] EMAIL_SENT_SUCCESS - abc-123-def-456
```

## Búsqueda de Logs End-to-End

### Buscar en todos los microservicios:

```bash
# Linux/Mac
grep -r "abc-123-def-456" */logs/application-*.log

# Windows PowerShell
Get-ChildItem -Recurse -Path . -Include application-*.log | Select-String "abc-123-def-456"
```

### Resultado esperado:

```
project_complaints/logs/application-2025-11-17.log:
  [INFO] Incoming Request - abc-123-def-456
  [INFO] UPDATE_COMPLAINT_STATUS_STARTED - abc-123-def-456
  [INFO] DB Operation: UPDATE - abc-123-def-456
  [INFO] EVENT_SENT_TO_SERVICE - abc-123-def-456
  [INFO] SENT_TO_SERVICE - abc-123-def-456

project_historical/logs/application-2025-11-17.log:
  [INFO] Incoming Request - abc-123-def-456
  [INFO] SAVE_EVENT_STARTED - abc-123-def-456
  [INFO] DB INSERT - abc-123-def-456

project_email_sender/logs/application-2025-11-17.log:
  [INFO] Incoming Request - abc-123-def-456
  [INFO] EMAIL_REQUEST_RECEIVED - abc-123-def-456
  [INFO] Queue PRODUCED - abc-123-def-456
  [INFO] Queue CONSUMED - abc-123-def-456
  [INFO] EMAIL_SENT_SUCCESS - abc-123-def-456
```

## Base de Datos - Trazabilidad Persistida

### Event Sourcing DB:

```sql
SELECT * FROM complaint_events
WHERE correlation_id = 'abc-123-def-456';

-- Resultado:
id_event | aggregate_id | event_type      | correlation_id      | created_at
---------|--------------|-----------------|--------------------|--------------------------
1        | 5            | STATUS_CHANGED  | abc-123-def-456    | 2025-11-17 10:30:00
```

## Ventajas de Este Sistema

✅ **Un solo ID rastrea toda la operación** en múltiples servicios  
✅ **Debugging simplificado** - busca un ID y encuentra todo el flujo  
✅ **Auditoría completa** - logs + eventos persistidos en BD  
✅ **Sin dependencias entre servicios** - cada uno loguea independientemente  
✅ **Escalabilidad** - cada servicio puede tener múltiples instancias  
✅ **Resiliencia** - si un servicio falla, no afecta el logging de otros  

## Casos de Uso

### 1. Usuario reporta error: "Mi queja no se actualizó"

Respuesta: "¿Cuál es el correlation ID que recibiste?"

```bash
# Buscar el ID en todos los servicios
grep "correlation-id-del-usuario" */logs/*.log

# Ver exactamente qué pasó en cada paso
```

### 2. Email no llegó

```bash
# Buscar en logs de email service
grep "correlation-id" project_email_sender/logs/*.log

# Ver si se produjo, consumió y envió
# Identificar en qué paso falló
```

### 3. Auditoría de cambio de estado

```sql
-- Ver en qué momento se cambió el estado
SELECT * FROM complaint_events 
WHERE aggregate_id = 5 
AND event_type = 'STATUS_CHANGED'
ORDER BY created_at;

-- Correlacionar con logs para ver quién y desde dónde
grep "correlation-id-del-evento" project_complaints/logs/*.log
```
