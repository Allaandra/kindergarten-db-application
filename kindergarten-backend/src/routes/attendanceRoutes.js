const express = require('express');
const router = express.Router();
const controller = require('../controllers/attendanceController');

router.post('/', controller.getAttendanceByDate);

module.exports = router;