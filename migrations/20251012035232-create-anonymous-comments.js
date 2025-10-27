'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ANONYMOUS_COMMENTS', {
      id_comment: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      id_complaint: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'COMPLAINTS',
          key: 'id_complaint'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      comment_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      status: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('ANONYMOUS_COMMENTS');
  }
};