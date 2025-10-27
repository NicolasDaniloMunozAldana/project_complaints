
const { Comment } = require('../models');

class CommentsRepository {
    /**
     * Obtener todos los comentarios de una queja específica
     * @param {number} id_complaint - ID de la queja
     * @returns {Promise<Array>} Lista de comentarios
     */
    async findByComplaintId(id_complaint) {
        return await Comment.findAll({
            attributes: ['id_comment', 'comment_text', 'created_at'],
            where: {
                id_complaint,
                status: 1
            },
            order: [['created_at', 'DESC']]
        });
    }

    /**
     * Crear un nuevo comentario anónimo
     * @param {Object} commentData - Datos del comentario
     * @param {number} commentData.id_complaint - ID de la queja
     * @param {string} commentData.comment_text - Texto del comentario
     * @returns {Promise<number>} ID del comentario creado
     */
    async create(commentData) {
        const comment = await Comment.create({
            id_complaint: commentData.id_complaint,
            comment_text: commentData.comment_text,
            status: 1 // Activo por defecto
        });
        return comment.id_comment;
    }
}

module.exports = new CommentsRepository();