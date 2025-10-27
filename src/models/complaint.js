// src/models/Complaint.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Complaint extends Model {}

Complaint.init({
  id_complaint: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_public_entity: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.STRING(500) },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
  complaint_status: { 
    type: DataTypes.ENUM('abierta', 'en_revision', 'cerrada'), 
    allowNull: false, 
    defaultValue: 'abierta' 
  },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  sequelize,
  modelName: 'Complaint',
  tableName: 'COMPLAINTS',
  timestamps: false
});

module.exports = Complaint;