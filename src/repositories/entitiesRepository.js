
const { Entity } = require('../models');

class EntitiesRepository {
    /**
     * Obtener todas las entidades públicas
     * @returns {Promise<Array>} Lista de entidades públicas
     */
    async findAll() {
        return await Entity.findAll({
            attributes: ['id_public_entity', 'name'],
            order: [['name', 'ASC']]
        });
    }

    /**
     * Obtener una entidad por ID
     * @param {number} id_public_entity - ID de la entidad
     * @returns {Promise<Object|null>} Datos de la entidad o null si no existe
     */
    async findById(id_public_entity) {
        return await Entity.findOne({
            attributes: ['id_public_entity', 'name'],
            where: { id_public_entity }
        });
    }

    /**
     * Verificar si una entidad existe
     * @param {number} id_public_entity - ID de la entidad
     * @returns {Promise<boolean>} true si existe, false si no
     */
    async exists(id_public_entity) {
        const entity = await Entity.findOne({
            attributes: ['id_public_entity'],
            where: { id_public_entity }
        });
        return !!entity;
    }
}


module.exports = new EntitiesRepository();
