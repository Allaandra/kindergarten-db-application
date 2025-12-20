const express = require('express');
const router = express.Router();
const controller = require('../controllers/groupController');

router.post('/', controller.getGroups);
router.post('/create', controller.createGroup);
router.post('/update', controller.updateGroup);
router.post('/delete', controller.deleteGroup);

router.post('/educators', controller.getEducators);

module.exports = router;