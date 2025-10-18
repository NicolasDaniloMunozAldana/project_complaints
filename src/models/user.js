// src/models/user.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class User extends Model {}

User.init({
  id_user: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  username: { 
    type: DataTypes.STRING(100), 
    allowNull: false 
  },
  password: { 
    type: DataTypes.STRING(255), 
    allowNull: false 
  },
  session_status: { 
    type: DataTypes.ENUM('active', 'inactive'), 
    allowNull: false, 
    defaultValue: 'inactive' 
  },
  created_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  },
  updated_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'USERS',
  timestamps: false
});

module.exports = User;
