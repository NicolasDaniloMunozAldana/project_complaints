const knex = require('../config/db');

exports.renderHome = (req, res) => {
    knex.select().from('PUBLIC_ENTITYS').then((results) => {
        res.render('home', { entitys: results });
    });
};
