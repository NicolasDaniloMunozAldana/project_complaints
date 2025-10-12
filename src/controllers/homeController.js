
const { Entity } = require('../models');

exports.renderHome = async (req, res) => {
    try {
        const results = await Entity.findAll();
        res.render('home', { entitys: results });
    } catch (error) {
        console.error('Error fetching entities:', error);
        res.status(500).render('error', { message: 'Error loading entities' });
    }
};
