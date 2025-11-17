# Microservicio de Event Sourcing - Configuración de Logging

## Descripción

Este microservicio almacena el historial de eventos de las quejas para auditoría y trazabilidad.

## Estructura Requerida

```
event-sourcing-service/
├── src/
│   ├── index.js
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── eventsController.js
│   ├── repositories/
│   │   └── eventsRepository.js
│   ├── middlewares/
│   │   └── correlationId.js
│   └── utils/
│       └── logger.js
├── migrations/
│   └── create-complaint-events.js
└── logs/
```

## 1. Instalar Dependencias

```bash
npm install winston winston-daily-rotate-file uuid axios express
```

## 2. Configurar Logger (src/utils/logger.js)

**Copia el mismo archivo `logger.js` del microservicio principal.**

El logger debe ser idéntico para mantener consistencia en los logs entre microservicios.

## 3. Middleware de Correlation ID (src/middlewares/correlationId.js)

**Copia el mismo archivo `correlationId.js` del microservicio principal.**

Este middleware:
- Extrae el `x-correlation-id` del header HTTP
- Si no existe, genera uno nuevo (aunque debería venir del servicio principal)
- Loguea todas las requests entrantes con el correlation ID

## 4. Migración de Base de Datos (migrations/create-complaint-events.js)

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('complaint_events', {
      id_event: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      aggregate_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Tipo de agregado (ej: COMPLAINT)'
      },
      aggregate_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID del agregado (ej: id_complaint)'
      },
      event_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Tipo de evento (ej: STATUS_CHANGED)'
      },
      event_data: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Datos del evento'
      },
      correlation_id: {
        type: Sequelize.STRING(36),
        allowNull: true,
        comment: 'UUID para trazabilidad entre microservicios'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices para búsquedas rápidas
    await queryInterface.addIndex('complaint_events', ['aggregate_id']);
    await queryInterface.addIndex('complaint_events', ['aggregate_type']);
    await queryInterface.addIndex('complaint_events', ['correlation_id']);
    await queryInterface.addIndex('complaint_events', ['created_at']);
    await queryInterface.addIndex('complaint_events', ['aggregate_type', 'aggregate_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('complaint_events');
  }
};
```

## 5. Controller (src/controllers/eventsController.js)

```javascript
const { logEvent, logError, logDatabaseOperation, logEventSourcing } = require('../utils/logger');
const eventsRepository = require('../repositories/eventsRepository');

/**
 * Guardar un nuevo evento
 */
exports.saveEvent = async (req, res) => {
    const correlationId = req.correlationId;
    const { aggregateType, aggregateId, eventType, eventData } = req.body;

    try {
        logEvent(
            'SAVE_EVENT_STARTED',
            { aggregateType, aggregateId, eventType },
            correlationId
        );

        // Validar datos
        if (!aggregateType || !aggregateId || !eventType || !eventData) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                correlationId
            });
        }

        // Guardar evento
        const eventId = await eventsRepository.saveEvent({
            aggregateType,
            aggregateId,
            eventType,
            eventData,
            correlationId
        });

        logEventSourcing(
            eventType,
            aggregateId,
            eventData,
            correlationId
        );

        res.status(201).json({
            success: true,
            eventId,
            message: 'Event saved successfully',
            correlationId
        });
    } catch (error) {
        logError(error, {
            controller: 'eventsController',
            action: 'saveEvent',
            aggregateId
        }, correlationId);

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            correlationId
        });
    }
};

/**
 * Obtener historial de eventos por agregado
 */
exports.getEventHistory = async (req, res) => {
    const correlationId = req.correlationId;
    const { aggregateType, aggregateId } = req.params;

    try {
        logDatabaseOperation(
            'SELECT',
            'complaint_events',
            { aggregateType, aggregateId },
            correlationId
        );

        const events = await eventsRepository.getEventsByAggregate(
            aggregateType,
            aggregateId
        );

        res.status(200).json({
            success: true,
            events,
            count: events.length,
            correlationId
        });
    } catch (error) {
        logError(error, {
            controller: 'eventsController',
            action: 'getEventHistory',
            aggregateId
        }, correlationId);

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            correlationId
        });
    }
};
```

## 6. Repository (src/repositories/eventsRepository.js)

```javascript
const { logDatabaseOperation, logError } = require('../utils/logger');

class EventsRepository {
    constructor(db) {
        this.db = db;
    }

    async saveEvent({ aggregateType, aggregateId, eventType, eventData, correlationId }) {
        try {
            const query = `
                INSERT INTO complaint_events 
                (aggregate_type, aggregate_id, event_type, event_data, correlation_id, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `;

            const [result] = await this.db.execute(query, [
                aggregateType,
                aggregateId,
                eventType,
                JSON.stringify(eventData),
                correlationId
            ]);

            logDatabaseOperation(
                'INSERT',
                'complaint_events',
                { eventId: result.insertId, aggregateId },
                correlationId
            );

            return result.insertId;
        } catch (error) {
            logError(error, {
                operation: 'saveEvent',
                aggregateId
            }, correlationId);
            throw error;
        }
    }

    async getEventsByAggregate(aggregateType, aggregateId) {
        try {
            const query = `
                SELECT * FROM complaint_events 
                WHERE aggregate_type = ? AND aggregate_id = ?
                ORDER BY created_at DESC
            `;

            const [events] = await this.db.execute(query, [aggregateType, aggregateId]);

            return events.map(event => ({
                ...event,
                event_data: JSON.parse(event.event_data)
            }));
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new EventsRepository(/* db connection */);
```

## 7. Index.js (src/index.js)

```javascript
require('dotenv').config();
const express = require('express');
const correlationIdMiddleware = require('./middlewares/correlationId');
const eventsController = require('./controllers/eventsController');
const { logger } = require('./utils/logger');

const app = express();

app.use(express.json());
app.use(correlationIdMiddleware);

// Rutas
app.post('/api/events', eventsController.saveEvent);
app.get('/api/events/:aggregateType/:aggregateId', eventsController.getEventHistory);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    logger.info(`Event Sourcing Service running on port ${PORT}`);
});
```

## 8. Variables de Entorno (.env)

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=event_sourcing_db
LOG_LEVEL=info
```

## 9. Ejecutar el Servicio

```bash
# Instalar dependencias
npm install

# Ejecutar migraciones
npx sequelize-cli db:migrate

# Iniciar servicio
npm start
```

## Trazabilidad de Logs

Todos los logs en este microservicio incluirán el mismo `correlation_id` que viene del microservicio principal, permitiendo rastrear eventos específicos a través de todo el sistema.

### Ejemplo de búsqueda:

```bash
# Buscar todos los logs relacionados con un correlation ID
grep "abc-123-def-456" logs/application-*.log
```

Esto mostrará todos los eventos procesados en este microservicio para esa operación específica.
