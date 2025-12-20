const express = require('express');
const router = express.Router();
const controller = require('../controllers/employeeController');

router.post('/', controller.getEmployees);
router.post('/create', controller.createEmployee);
router.post('/update', controller.updateEmployee);
router.post('/delete', controller.deleteEmployee);

router.post('/positions', controller.getPositions);

module.exports = router;