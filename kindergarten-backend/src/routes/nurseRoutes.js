const express = require('express');
const router = express.Router();
const controller = require('../controllers/nurseController');

router.post('/children', controller.getChildren);
router.post('/types', controller.getMedicalTypes);
router.post('/records', controller.getMedicalRecords);
router.post('/records/add', controller.addMedicalRecord);
router.post('/records/delete', controller.deleteMedicalRecord);

module.exports = router;