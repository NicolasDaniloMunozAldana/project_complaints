const express = require('express');
const router = express.Router();
const complaintsController = require('../controllers/complaintsController');

// Rutas estáticas de gestión de quejas
router.get('/list', complaintsController.listComplaints);
router.post('/file', complaintsController.fileComplaint);
router.get('/stats', complaintsController.complaintsStats);
router.post('/delete', complaintsController.deleteComplaint);
router.post('/update-status', complaintsController.updateComplaintStatus);

// Rutas estáticas de comentarios
router.post('/comments', complaintsController.addComment);

// Rutas dinámicas (deben ir después de las estáticas)
router.get('/:id_complaint/comments', complaintsController.getComments);
router.get('/:id_complaint/details', complaintsController.getComplaintDetails);

module.exports = router;
