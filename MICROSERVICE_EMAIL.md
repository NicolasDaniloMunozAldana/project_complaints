# Microservicio de Email - Configuración de Logging

## Descripción

Este microservicio maneja el envío de correos mediante un sistema de producer/consumer con colas de mensajes (Kafka, RabbitMQ, Redis, etc.).

## Estructura Requerida

```
email-service/
├── src/
│   ├── index.js
│   ├── config/
│   │   └── queue.js
│   ├── controllers/
│   │   └── emailController.js
│   ├── services/
│   │   ├── emailProducer.js
│   │   ├── emailConsumer.js
│   │   └── emailSender.js
│   ├── middlewares/
│   │   └── correlationId.js
│   └── utils/
│       └── logger.js
└── logs/
```

## 1. Instalar Dependencias

```bash
npm install winston winston-daily-rotate-file uuid axios express nodemailer
# Más dependencias según tu sistema de colas:
npm install kafkajs  # Si usas Kafka
# o
npm install amqplib  # Si usas RabbitMQ
# o
npm install redis    # Si usas Redis
```

## 2. Configurar Logger (src/utils/logger.js)

**Copia el mismo archivo `logger.js` del microservicio principal.**

## 3. Middleware de Correlation ID (src/middlewares/correlationId.js)

**Copia el mismo archivo `correlationId.js` del microservicio principal.**

## 4. Producer (src/services/emailProducer.js)

```javascript
const { logMessageQueue, logError } = require('../utils/logger');

class EmailProducer {
    constructor(queue) {
        this.queue = queue; // Instancia de Kafka/RabbitMQ/Redis
    }

    /**
     * Agregar mensaje a la cola
     */
    async produce(emailData, correlationId) {
        try {
            const message = {
                correlationId,
                timestamp: new Date().toISOString(),
                data: emailData
            };

            logMessageQueue(
                'PRODUCED',
                'EMAIL_SEND',
                {
                    to: emailData.to,
                    subject: emailData.subject
                },
                correlationId
            );

            // Enviar a la cola (ejemplo con Kafka)
            await this.queue.send({
                topic: 'emails',
                messages: [{
                    key: correlationId,
                    value: JSON.stringify(message)
                }]
            });

            return { success: true };
        } catch (error) {
            logError(error, {
                operation: 'produceEmail',
                emailTo: emailData.to
            }, correlationId);
            throw error;
        }
    }
}

module.exports = EmailProducer;
```

## 5. Consumer (src/services/emailConsumer.js)

```javascript
const { logMessageQueue, logError } = require('../utils/logger');
const emailSender = require('./emailSender');

class EmailConsumer {
    constructor(queue) {
        this.queue = queue;
    }

    /**
     * Iniciar consumo de mensajes
     */
    async startConsuming() {
        try {
            // Ejemplo con Kafka
            await this.queue.subscribe({ topic: 'emails', fromBeginning: false });

            await this.queue.run({
                eachMessage: async ({ message }) => {
                    await this.processMessage(message);
                }
            });
        } catch (error) {
            logError(error, { operation: 'startConsuming' });
            throw error;
        }
    }

    /**
     * Procesar un mensaje individual
     */
    async processMessage(message) {
        let correlationId = 'unknown';
        
        try {
            const payload = JSON.parse(message.value.toString());
            correlationId = payload.correlationId;
            const emailData = payload.data;

            logMessageQueue(
                'CONSUMED',
                'EMAIL_SEND',
                {
                    to: emailData.to,
                    subject: emailData.subject
                },
                correlationId
            );

            // Enviar el correo
            await emailSender.send(emailData, correlationId);

            logMessageQueue(
                'PROCESSED',
                'EMAIL_SEND',
                {
                    to: emailData.to,
                    status: 'SUCCESS'
                },
                correlationId
            );
        } catch (error) {
            logError(error, {
                operation: 'processMessage'
            }, correlationId);

            logMessageQueue(
                'FAILED',
                'EMAIL_SEND',
                {
                    error: error.message
                },
                correlationId
            );

            // Aquí puedes re-encolar o enviar a Dead Letter Queue
        }
    }
}

module.exports = EmailConsumer;
```

## 6. Email Sender (src/services/emailSender.js)

```javascript
const nodemailer = require('nodemailer');
const { logEvent, logError } = require('../utils/logger');

class EmailSender {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async send(emailData, correlationId) {
        try {
            logEvent(
                'EMAIL_SEND_STARTED',
                {
                    to: emailData.to,
                    subject: emailData.subject
                },
                correlationId
            );

            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.html || emailData.body
            });

            logEvent(
                'EMAIL_SENT_SUCCESS',
                {
                    to: emailData.to,
                    messageId: info.messageId
                },
                correlationId
            );

            return { success: true, messageId: info.messageId };
        } catch (error) {
            logError(error, {
                operation: 'sendEmail',
                emailTo: emailData.to
            }, correlationId);
            throw error;
        }
    }
}

module.exports = new EmailSender();
```

## 7. Controller (src/controllers/emailController.js)

```javascript
const { logEvent, logError } = require('../utils/logger');
const EmailProducer = require('../services/emailProducer');

/**
 * Recibir solicitud de email y agregarla a la cola
 */
exports.sendEmail = async (req, res) => {
    const correlationId = req.correlationId;
    const { type, data } = req.body;

    try {
        logEvent(
            'EMAIL_REQUEST_RECEIVED',
            {
                type,
                to: data.to
            },
            correlationId
        );

        // Validar datos
        if (!data.to || !data.subject) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                correlationId
            });
        }

        // Agregar a la cola
        const producer = new EmailProducer(/* queue instance */);
        await producer.produce(data, correlationId);

        res.status(202).json({
            success: true,
            message: 'Email queued for sending',
            correlationId
        });
    } catch (error) {
        logError(error, {
            controller: 'emailController',
            action: 'sendEmail'
        }, correlationId);

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            correlationId
        });
    }
};
```

## 8. Index.js (src/index.js)

```javascript
require('dotenv').config();
const express = require('express');
const correlationIdMiddleware = require('./middlewares/correlationId');
const emailController = require('./controllers/emailController');
const EmailConsumer = require('./services/emailConsumer');
const { logger } = require('./utils/logger');

const app = express();

app.use(express.json());
app.use(correlationIdMiddleware);

// Rutas
app.post('/api/emails/send', emailController.sendEmail);

// Iniciar consumer
const consumer = new EmailConsumer(/* queue instance */);
consumer.startConsuming()
    .then(() => logger.info('Email consumer started'))
    .catch(error => logger.error('Failed to start consumer', error));

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    logger.info(`Email Service running on port ${PORT}`);
});
```

## 9. Variables de Entorno (.env)

```env
PORT=3002
LOG_LEVEL=info

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourapp.com

# Queue Configuration (ejemplo Kafka)
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=email-service
KAFKA_GROUP_ID=email-consumers
```

## 10. Ejecutar el Servicio

```bash
# Instalar dependencias
npm install

# Iniciar servicio (incluye producer y consumer)
npm start
```

## Trazabilidad de Logs

### Flujo Completo de un Email:

1. **Microservicio Principal** → Envía request HTTP con `x-correlation-id`
2. **Email Service Controller** → Recibe request, loguea `EMAIL_REQUEST_RECEIVED`
3. **Producer** → Agrega mensaje a cola, loguea `PRODUCED`
4. **Consumer** → Consume mensaje, loguea `CONSUMED`
5. **Email Sender** → Envía correo, loguea `EMAIL_SENT_SUCCESS` o error
6. **Consumer** → Confirma procesamiento, loguea `PROCESSED`

### Buscar logs de un email específico:

```bash
# Buscar en todos los logs del servicio
grep "abc-123-def-456" logs/application-*.log

# Ver solo eventos de email
grep "abc-123-def-456" logs/application-*.log | grep EMAIL
```

## Ejemplo de Logs Generados

```json
{
  "message": "EMAIL_REQUEST_RECEIVED",
  "correlationId": "abc-123-def-456",
  "type": "EMAIL_SEND",
  "to": "user@example.com",
  "timestamp": "2025-11-17T10:30:00.000Z",
  "level": "info"
}

{
  "message": "Queue PRODUCED: EMAIL_SEND",
  "correlationId": "abc-123-def-456",
  "to": "user@example.com",
  "subject": "Complaint Status Changed",
  "timestamp": "2025-11-17T10:30:01.000Z",
  "level": "info"
}

{
  "message": "Queue CONSUMED: EMAIL_SEND",
  "correlationId": "abc-123-def-456",
  "to": "user@example.com",
  "timestamp": "2025-11-17T10:30:02.000Z",
  "level": "info"
}

{
  "message": "EMAIL_SENT_SUCCESS",
  "correlationId": "abc-123-def-456",
  "to": "user@example.com",
  "messageId": "<abc@mail.gmail.com>",
  "timestamp": "2025-11-17T10:30:03.000Z",
  "level": "info"
}
```

Con estos logs, puedes rastrear cada email desde que se solicitó hasta que se envió exitosamente.
