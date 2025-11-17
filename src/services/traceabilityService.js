const logViewerService = require('./logViewerService');

/**
 * Servicio de trazabilidad para eventos de negocio
 * Permite buscar y organizar eventos relacionados con un correlation ID
 */
class TraceabilityService {
  /**
   * Obtener trazabilidad completa de un evento de negocio por correlation ID
   * @param {string} correlationId - ID de correlación
   * @returns {Promise<Object>} Trazabilidad completa del evento
   */
  async getEventTraceability(correlationId) {
    try {
      if (!correlationId) {
        return {
          success: false,
          message: 'Correlation ID es requerido',
          data: null
        };
      }

      // Buscar todos los logs relacionados con el correlation ID
      const logResults = await logViewerService.searchByCorrelationId(correlationId);

      // Organizar eventos por tipo y servicio
      const traceability = {
        correlationId,
        summary: {
          totalEvents: 0,
          services: [],
          eventTypes: [],
          timeRange: {
            start: null,
            end: null
          },
          status: 'unknown'
        },
        timeline: [],
        eventsByService: {},
        eventsByType: {},
        errors: []
      };

      // Procesar logs de todos los archivos
      for (const fileResult of logResults) {
        for (const log of fileResult.logs) {
          traceability.summary.totalEvents++;

          // Extraer información del servicio
          const service = log.service || 'main-service';
          if (!traceability.summary.services.includes(service)) {
            traceability.summary.services.push(service);
          }

          // Extraer tipo de evento
          let eventType = 'UNKNOWN';
          if (log.businessEvent) {
            eventType = log.eventType || log.message?.split(':')[1]?.trim() || 'UNKNOWN';
          } else if (log.kafkaEvent) {
            eventType = `KAFKA_${log.action || 'EVENT'}`;
          } else if (log.microserviceCall) {
            eventType = `MICROSERVICE_${log.action || 'CALL'}`;
          } else if (log.level === 'error') {
            eventType = 'ERROR';
          } else {
            eventType = log.message?.split(' ')[0] || 'LOG';
          }

          if (!traceability.summary.eventTypes.includes(eventType)) {
            traceability.summary.eventTypes.push(eventType);
          }

          // Construir evento de timeline
          const timelineEvent = {
            timestamp: log.timestamp || log.eventData?.timestamp || new Date().toISOString(),
            service,
            eventType,
            level: log.level || 'info',
            message: log.message,
            data: log.eventData || log.data || {},
            file: fileResult.file
          };

          traceability.timeline.push(timelineEvent);

          // Agrupar por servicio
          if (!traceability.eventsByService[service]) {
            traceability.eventsByService[service] = [];
          }
          traceability.eventsByService[service].push(timelineEvent);

          // Agrupar por tipo
          if (!traceability.eventsByType[eventType]) {
            traceability.eventsByType[eventType] = [];
          }
          traceability.eventsByType[eventType].push(timelineEvent);

          // Capturar errores
          if (log.level === 'error') {
            traceability.errors.push({
              timestamp: timelineEvent.timestamp,
              service,
              message: log.message,
              error: log.error,
              context: log.context
            });
          }

          // Actualizar rango de tiempo
          const eventTime = new Date(timelineEvent.timestamp);
          if (!traceability.summary.timeRange.start || eventTime < traceability.summary.timeRange.start) {
            traceability.summary.timeRange.start = eventTime;
          }
          if (!traceability.summary.timeRange.end || eventTime > traceability.summary.timeRange.end) {
            traceability.summary.timeRange.end = eventTime;
          }
        }
      }

      // Ordenar timeline por timestamp
      traceability.timeline.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );

      // Determinar estado general
      if (traceability.errors.length > 0) {
        traceability.summary.status = 'error';
      } else if (traceability.summary.totalEvents > 0) {
        // Buscar eventos de éxito
        const hasSuccess = traceability.timeline.some(e => 
          e.eventType.includes('SUCCESS') || 
          e.eventType.includes('PUBLISHED') ||
          e.eventType.includes('SENT')
        );
        traceability.summary.status = hasSuccess ? 'success' : 'in_progress';
      }

      // Convertir fechas a ISO string para JSON
      if (traceability.summary.timeRange.start) {
        traceability.summary.timeRange.start = traceability.summary.timeRange.start.toISOString();
      }
      if (traceability.summary.timeRange.end) {
        traceability.summary.timeRange.end = traceability.summary.timeRange.end.toISOString();
      }

      return {
        success: true,
        message: `Trazabilidad encontrada para correlation ID: ${correlationId}`,
        data: traceability
      };
    } catch (error) {
      console.error('Error getting event traceability:', error);
      return {
        success: false,
        message: 'Error al obtener trazabilidad',
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Obtener eventos de negocio recientes
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Object>} Lista de eventos de negocio
   */
  async getRecentBusinessEvents(limit = 50) {
    try {
      const files = await logViewerService.getLogFiles();
      const businessEvents = [];

      // Buscar en los archivos más recientes
      for (const file of files.slice(0, 3)) { // Solo los 3 más recientes
        const { logs } = await logViewerService.readLogs(file.name, {
          limit: limit * 3, // Leer más para filtrar
          offset: 0,
          reverse: true // Leer desde el final (logs más recientes primero)
        });

        // Filtrar solo eventos de negocio
        const filtered = logs.filter(log => 
          log.businessEvent === true || 
          log.message?.includes('BUSINESS_EVENT') ||
          (log.eventType && (log.message?.includes('EVENT:') || log.message?.includes('BUSINESS_EVENT')))
        );

        businessEvents.push(...filtered.map(log => ({
          correlationId: log.correlationId,
          timestamp: log.timestamp,
          eventType: log.eventType,
          service: log.service || 'main-service',
          data: log.eventData || log.data || {},
          file: file.name
        })));

        if (businessEvents.length >= limit) {
          break;
        }
      }

      // Ordenar por timestamp descendente y limitar
      businessEvents.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      // Agrupar por correlation ID
      const eventsByCorrelation = {};
      for (const event of businessEvents.slice(0, limit)) {
        if (event.correlationId) {
          if (!eventsByCorrelation[event.correlationId]) {
            eventsByCorrelation[event.correlationId] = {
              correlationId: event.correlationId,
              firstEvent: event.timestamp,
              lastEvent: event.timestamp,
              eventCount: 0,
              services: new Set(),
              eventTypes: new Set()
            };
          }
          const group = eventsByCorrelation[event.correlationId];
          group.eventCount++;
          group.services.add(event.service);
          group.eventTypes.add(event.eventType);
          
          // Comparar timestamps correctamente
          const eventTime = new Date(event.timestamp);
          const firstTime = new Date(group.firstEvent);
          const lastTime = new Date(group.lastEvent);
          
          if (eventTime < firstTime || !group.firstEvent) {
            group.firstEvent = event.timestamp;
          }
          if (eventTime > lastTime || !group.lastEvent) {
            group.lastEvent = event.timestamp;
          }
        }
      }

      // Convertir Sets a Arrays
      for (const correlationId in eventsByCorrelation) {
        eventsByCorrelation[correlationId].services = Array.from(eventsByCorrelation[correlationId].services);
        eventsByCorrelation[correlationId].eventTypes = Array.from(eventsByCorrelation[correlationId].eventTypes);
      }

      return {
        success: true,
        data: {
          events: businessEvents.slice(0, limit),
          byCorrelation: Object.values(eventsByCorrelation)
        }
      };
    } catch (error) {
      console.error('Error getting recent business events:', error);
      return {
        success: false,
        message: 'Error al obtener eventos recientes',
        error: error.message,
        data: null
      };
    }
  }
}

module.exports = new TraceabilityService();

