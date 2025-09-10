const express = require('express');
const router = express.Router();
const complaintsController = require('../controllers/complaintsController');

router.get('/list', complaintsController.listComplaints);
router.post('/file', complaintsController.fileComplaint);
router.get('/stats', complaintsController.complaintsStats);

module.exports = router;
