'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear schema histórico
    await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS historical;');

    // Crear tabla de historial de cambios de estado en el schema histórico
    await queryInterface.createTable(
      'complaint_status_history',
      {
        id_history: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        id_complaint: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID de la queja relacionada',
        },
        previous_status: {
          type: Sequelize.ENUM('abierta', 'en_revision', 'cerrada'),
          allowNull: true,
          comment: 'Estado anterior de la queja',
        },
        new_status: {
          type: Sequelize.ENUM('abierta', 'en_revision', 'cerrada'),
          allowNull: false,
          comment: 'Nuevo estado de la queja',
        },
        changed_by: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Usuario que realizó el cambio',
        },
        change_description: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Descripción del cambio',
        },
        event_timestamp: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Fecha y hora del evento',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        schema: 'historical',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      }
    );

    // Crear índices para mejorar las consultas
    await queryInterface.addIndex(
      { tableName: 'complaint_status_history', schema: 'historical' },
      ['id_complaint'],
      {
        name: 'idx_complaint_id',
      }
    );

    await queryInterface.addIndex(
      { tableName: 'complaint_status_history', schema: 'historical' },
      ['event_timestamp'],
      {
        name: 'idx_event_timestamp',
      }
    );

    await queryInterface.addIndex(
      { tableName: 'complaint_status_history', schema: 'historical' },
      ['new_status'],
      {
        name: 'idx_new_status',
      }
    );
  },

  down: async (queryInterface) => {
    // Eliminar tabla
    await queryInterface.dropTable({
      tableName: 'complaint_status_history',
      schema: 'historical',
    });

    // Eliminar schema (solo si está vacío)
    await queryInterface.sequelize.query('DROP SCHEMA IF EXISTS historical;');
  },
};
