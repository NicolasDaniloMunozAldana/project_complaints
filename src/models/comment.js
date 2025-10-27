// src/models/Comment.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Comment extends Model {}

Comment.init({
  id_comment: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_complaint: { type: DataTypes.INTEGER, allowNull: false },
  comment_text: { type: DataTypes.TEXT, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
}, {
  sequelize,
  modelName: 'Comment',
  tableName: 'ANONYMOUS_COMMENTS',
  timestamps: false
});

module.exports = Comment;