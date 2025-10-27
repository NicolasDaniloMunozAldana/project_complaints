// src/models/Entity.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Entity extends Model {}

Entity.init({
  id_public_entity: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false }
}, {
  sequelize,
  modelName: 'Entity',
  tableName: 'PUBLIC_ENTITIES',
  timestamps: false
});

module.exports = Entity;