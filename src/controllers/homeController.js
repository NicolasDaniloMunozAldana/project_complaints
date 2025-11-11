
const { Entity } = require('../models');

exports.renderHome = async (req, res) => {
    try {
        const results = await Entity.findAll();
        res.render('home', { entitys: results });
    } catch (error) {
        console.error('[ERROR] Error fetching entities:', error.message);
        res.status(500).render('error', { message: 'Error loading entities' });
    }
};
