'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PUBLIC_ENTITIES', {
      id_public_entity: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false
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

    await queryInterface.bulkInsert('PUBLIC_ENTITIES', [
      { id_public_entity: 1, name: 'Gobernación de Boyacá' },
      { id_public_entity: 2, name: 'Secretaría de Salud de Boyacá' },
      { id_public_entity: 3, name: 'INDEPORTES Boyacá' },
      { id_public_entity: 4, name: 'Instituto de Tránsito de Boyacá (ITBOY)' },
      { id_public_entity: 5, name: 'Alcaldia Mayor de Tunja' }
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('PUBLIC_ENTITIES');
  }
};