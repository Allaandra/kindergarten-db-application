const express = require('express');
const router = express.Router();
const controller = require('../controllers/relativeController');

router.post('/', controller.getRelatives);
router.post('/create', controller.createRelative);
router.post('/update', controller.updateRelative);
router.post('/delete', controller.deleteRelative);

module.exports = router;