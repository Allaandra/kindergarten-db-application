const express = require('express');
const router = express.Router();
const controller = require('../controllers/educatorController');

router.post('/my-groups', controller.getMyGroups);        // Отримати список груп
router.post('/group-children', controller.getGroupChildren); // Отримати дітей групи
router.post('/save-attendance', controller.saveAttendance);
router.post('/schedule', controller.getSchedule);         // Отримати розклад

module.exports = router;