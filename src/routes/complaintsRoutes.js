const express = require('express');
const router = express.Router();
const complaintsController = require('../controllers/complaintsController');

router.get('/list', complaintsController.listComplaints);
router.post('/file', complaintsController.fileComplaint);
router.get('/stats', complaintsController.complaintsStats);
router.post('/delete', complaintsController.deleteComplaint);
router.post('/update-status', complaintsController.updateComplaintStatus);

// Rutas para comentarios anónimos
router.get('/:id_complaint/comments', complaintsController.getComments);
router.post('/comments', complaintsController.addComment);
router.get('/:id_complaint/details', complaintsController.getComplaintDetails);

module.exports = router;
