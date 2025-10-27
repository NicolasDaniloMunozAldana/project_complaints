'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('COMPLAINTS', {
      id_complaint: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      id_public_entity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'PUBLIC_ENTITIES',
          key: 'id_public_entity'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      description: {
        type: Sequelize.STRING(500)
      },
      status: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1
      },
      complaint_status: {
        type: Sequelize.ENUM('abierta', 'en_revision', 'cerrada'),
        allowNull: false,
        defaultValue: 'abierta'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('COMPLAINTS');
  }
};