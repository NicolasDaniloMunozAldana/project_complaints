# Instalación de Sistema de Logging y Trazabilidad

## Descripción

Este sistema implementa logging completo con trazabilidad entre microservicios usando **Correlation IDs** y **Winston**.

## Para Este Repositorio (Microservicio Principal)

### 1. Instalar Dependencias

```bash
npm install winston winston-daily-rotate-file uuid axios
```

### 2. Configurar Variables de Entorno

Agregar al archivo `.env`:

```env
# Logging
LOG_LEVEL=info

# Microservices URLs
EVENT_SOURCING_SERVICE_URL=http://localhost:3001
EMAIL_SERVICE_URL=http://localhost:3002
```

### 3. Verificar Estructura

El sistema ya está implementado con:
- ✅ `src/utils/logger.js` - Logger centralizado
- ✅ `src/middlewares/correlationId.js` - Middleware de correlation IDs
- ✅ `src/repositories/complaintEventRepository.js` - Cliente HTTP para Event Sourcing
- ✅ `src/services/emailQueueService.js` - Cliente HTTP para Email Service
- ✅ `logs/` - Carpeta para almacenar logs

### 4. Verificar Integración en index.js

El middleware ya está integrado:
```javascript
app.use(correlationIdMiddleware);
```

## Para Otros Microservicios

### Microservicio de Event Sourcing

📖 **Ver guía completa:** [MICROSERVICE_EVENT_SOURCING.md](./MICROSERVICE_EVENT_SOURCING.md)

**Resumen:**
1. Crear nuevo proyecto Node.js
2. Copiar `logger.js` y `correlationId.js` de este repo
3. Instalar: `npm install winston winston-daily-rotate-file uuid express sequelize`
4. Crear migración para tabla `complaint_events`
5. Implementar endpoints para guardar/consultar eventos
6. Ejecutar en puerto 3001

### Microservicio de Email

📖 **Ver guía completa:** [MICROSERVICE_EMAIL.md](./MICROSERVICE_EMAIL.md)

**Resumen:**
1. Crear nuevo proyecto Node.js
2. Copiar `logger.js` y `correlationId.js` de este repo
3. Instalar: `npm install winston winston-daily-rotate-file uuid express nodemailer kafkajs`
4. Configurar producer/consumer de colas
5. Implementar envío de emails
6. Ejecutar en puerto 3002

## Verificación de Instalación

### 1. Probar el sistema:

```bash
# Iniciar microservicio principal
npm start

# Hacer una request
curl -X POST http://localhost:3030/complaints/file \
  -H "Content-Type: application/json" \
  -d '{"entity":1,"description":"Test"}'
```

### 2. Verificar logs generados:

```bash
# Ver logs del día actual
cat logs/application-$(date +%Y-%m-%d).log

# Buscar por correlation ID
grep "correlation-id-aqui" logs/application-*.log
```

### 3. Verificar propagación entre servicios:

Si tienes los otros microservicios corriendo, busca el mismo correlation ID en sus logs.

## Dependencias Verificadas

Asegúrate de que tu `package.json` incluya:

```json
{
  "dependencies": {
    "winston": "^3.11.0",
    "winston-daily-rotate-file": "^4.7.1",
    "uuid": "^9.0.1",
    "axios": "^1.6.0"
  }
}
```

## Troubleshooting

### Los logs no se generan

1. Verificar que la carpeta `logs/` existe
2. Verificar permisos de escritura
3. Verificar variable `LOG_LEVEL` en `.env`

### Los correlation IDs no aparecen

1. Verificar que el middleware esté registrado antes de las rutas
2. Verificar que el cliente HTTP incluya el header `x-correlation-id`

### No se propagan entre microservicios

1. Verificar las URLs de los microservicios en `.env`
2. Verificar que los servicios externos estén corriendo
3. Verificar que los servicios externos también usen el middleware de correlation ID

## Próximos Pasos

1. ✅ Instalar dependencias en este repositorio
2. ⚠️ Configurar microservicio de Event Sourcing
3. ⚠️ Configurar microservicio de Email
4. ✅ Probar trazabilidad end-to-end

## Documentación Adicional

- [LOGGING.md](./LOGGING.md) - Documentación completa del sistema
- [TRACEABILITY_GUIDE.md](./TRACEABILITY_GUIDE.md) - Guía de trazabilidad
- [MICROSERVICE_EVENT_SOURCING.md](./MICROSERVICE_EVENT_SOURCING.md) - Setup Event Sourcing
- [MICROSERVICE_EMAIL.md](./MICROSERVICE_EMAIL.md) - Setup Email Service
