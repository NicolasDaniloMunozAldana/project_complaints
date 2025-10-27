
const { Complaint, Entity } = require('../models');

class ComplaintsRepository {
    /**
     * Crear una nueva queja
     * @param {Object} complaintData - Datos de la queja
     * @param {number} complaintData.id_public_entity - ID de la entidad pública
     * @param {string} complaintData.description - Descripción de la queja
     * @returns {Promise<number>} ID de la queja creada
     */
    async create(complaintData) {
        const complaint = await Complaint.create({
            id_public_entity: complaintData.id_public_entity,
            description: complaintData.description,
            complaint_status: 'abierta', // Estado inicial por defecto
            status: 1 // Activo por defecto
        });
        return complaint.id_complaint;
    }

    /**
     * Obtener todas las quejas activas con información de la entidad
     * @returns {Promise<Array>} Lista de quejas
     */
    async findAllActive() {
        return await Complaint.findAll({
            attributes: ['id_complaint', 'description', 'complaint_status', 'created_at'],
            where: { status: 1 },
            include: [{
                model: Entity,
                attributes: ['name'],
            }],
            order: [['created_at', 'DESC']]
        });
    }

    /**
     * Obtener una queja específica por ID
     * @param {number} id_complaint - ID de la queja
     * @returns {Promise<Object|null>} Datos de la queja o null si no existe
     */
    async findById(id_complaint) {
        return await Complaint.findOne({
            attributes: ['id_complaint', 'description', 'complaint_status', 'created_at', 'updated_at'],
            where: { id_complaint, status: 1 },
            include: [{
                model: Entity,
                attributes: ['name'],
            }]
        });
    }

    /**
     * Eliminar una queja (soft delete)
     * @param {number} id_complaint - ID de la queja
     * @returns {Promise<boolean>} true si se eliminó, false si no se encontró
     */
    async softDelete(id_complaint) {
        const [count] = await Complaint.update(
            { status: 0 },
            { where: { id_complaint } }
        );
        return count > 0;
    }

    /**
     * Actualizar el estado de una queja
     * @param {number} id_complaint - ID de la queja
     * @param {string} complaint_status - Nuevo estado
     * @returns {Promise<boolean>} true si se actualizó, false si no se encontró
     */
    async updateStatus(id_complaint, complaint_status) {
        const [count] = await Complaint.update(
            { complaint_status, updated_at: new Date() },
            { where: { id_complaint } }
        );
        return count > 0;
    }

    /**
     * Obtener estadísticas de quejas por entidad
     * @returns {Promise<Array>} Estadísticas por entidad
     */
    async getStatsByEntity() {
        // Sequelize no soporta count con join y groupBy tan directo, así que usamos query cruda
        const [results] = await Complaint.sequelize.query(`
            SELECT p.name as public_entity, COUNT(c.id_complaint) as total_complaints
            FROM COMPLAINTS c
            JOIN PUBLIC_ENTITIES p ON c.id_public_entity = p.id_public_entity
            WHERE c.status = 1
            GROUP BY p.id_public_entity, p.name
            ORDER BY total_complaints DESC
        `);
        return results;
    }

    /**
     * Obtener estadísticas de quejas por estado
     * @returns {Promise<Array>} Estadísticas por estado
     */
    async getStatsByStatus() {
        const [results] = await Complaint.sequelize.query(`
            SELECT complaint_status, COUNT(id_complaint) as total
            FROM COMPLAINTS
            WHERE status = 1
            GROUP BY complaint_status
        `);
        return results;
    }
}

module.exports = new ComplaintsRepository();
