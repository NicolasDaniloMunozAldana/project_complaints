const knex = require('../config/db');

class ComplaintsRepository {
    /**
     * Crear una nueva queja
     * @param {Object} complaintData - Datos de la queja
     * @param {number} complaintData.id_public_entity - ID de la entidad pública
     * @param {string} complaintData.description - Descripción de la queja
     * @returns {Promise<number>} ID de la queja creada
     */
    async create(complaintData) {
        const [id] = await knex('COMPLAINTS')
            .insert({
                id_public_entity: complaintData.id_public_entity,
                description: complaintData.description,
                complaint_status: 'abierta', // Estado inicial por defecto
                status: 1 // Activo por defecto
            })
            .returning('id_complaint');
        
        return id;
    }

    /**
     * Obtener todas las quejas activas con información de la entidad
     * @returns {Promise<Array>} Lista de quejas
     */
    async findAllActive() {
        return await knex('COMPLAINTS as c')
            .join('PUBLIC_ENTITYS as p', 'c.id_public_entity', 'p.id_public_entity')
            .select(
                'c.id_complaint', 
                'p.name as public_entity', 
                'c.description', 
                'c.complaint_status', 
                'c.created_at'
            )
            .where('c.status', 1)
            .orderBy('c.created_at', 'desc');
    }

    /**
     * Obtener una queja específica por ID
     * @param {number} id_complaint - ID de la queja
     * @returns {Promise<Object|null>} Datos de la queja o null si no existe
     */
    async findById(id_complaint) {
        return await knex('COMPLAINTS as c')
            .join('PUBLIC_ENTITYS as p', 'c.id_public_entity', 'p.id_public_entity')
            .select(
                'c.id_complaint', 
                'p.name as public_entity', 
                'c.description',
                'c.complaint_status', 
                'c.created_at', 
                'c.updated_at'
            )
            .where('c.id_complaint', id_complaint)
            .where('c.status', 1)
            .first();
    }

    /**
     * Eliminar una queja (soft delete)
     * @param {number} id_complaint - ID de la queja
     * @returns {Promise<boolean>} true si se eliminó, false si no se encontró
     */
    async softDelete(id_complaint) {
        const count = await knex('COMPLAINTS')
            .where('id_complaint', id_complaint)
            .update({ status: 0 });
        
        return count > 0;
    }

    /**
     * Actualizar el estado de una queja
     * @param {number} id_complaint - ID de la queja
     * @param {string} complaint_status - Nuevo estado
     * @returns {Promise<boolean>} true si se actualizó, false si no se encontró
     */
    async updateStatus(id_complaint, complaint_status) {
        const count = await knex('COMPLAINTS')
            .where('id_complaint', id_complaint)
            .update({ 
                complaint_status: complaint_status,
                updated_at: knex.fn.now()
            });
        
        return count > 0;
    }

    /**
     * Obtener estadísticas de quejas por entidad
     * @returns {Promise<Array>} Estadísticas por entidad
     */
    async getStatsByEntity() {
        return await knex('COMPLAINTS as c')
            .join('PUBLIC_ENTITYS as p', 'c.id_public_entity', 'p.id_public_entity')
            .select('p.name as public_entity')
            .count('c.id_complaint as total_complaints')
            .where('c.status', 1)
            .groupBy('p.id_public_entity', 'p.name')
            .orderBy('total_complaints', 'desc');
    }

    /**
     * Obtener estadísticas de quejas por estado
     * @returns {Promise<Array>} Estadísticas por estado
     */
    async getStatsByStatus() {
        return await knex('COMPLAINTS')
            .select('complaint_status')
            .count('id_complaint as total')
            .where('status', 1)
            .groupBy('complaint_status');
    }
}

module.exports = new ComplaintsRepository();