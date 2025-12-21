const express = require('express');
const router = express.Router();
const controller = require('../controllers/scheduleController');

router.post('/', controller.getSchedule);
router.post('/activities', controller.getActivities); // Для списку занять
router.post('/add', controller.addScheduleItem);
router.post('/delete', controller.deleteScheduleItem);

module.exports = router;