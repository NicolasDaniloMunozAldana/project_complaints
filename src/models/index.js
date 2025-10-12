const Complaint = require('./complaint');
const Entity = require('./entity');
const Comment = require('./comment');
const User = require('./user');

Complaint.belongsTo(Entity, { foreignKey: 'id_public_entity' });
Entity.hasMany(Complaint, { foreignKey: 'id_public_entity' });

Complaint.hasMany(Comment, { foreignKey: 'id_complaint' });
Comment.belongsTo(Complaint, { foreignKey: 'id_complaint' });

module.exports = { Complaint, Entity, Comment, User };