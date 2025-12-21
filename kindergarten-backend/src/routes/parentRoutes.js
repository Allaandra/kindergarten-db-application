const express = require('express');
const router = express.Router();
const controller = require('../controllers/parentController');

router.post('/my-children', controller.getMyChildren);
router.post('/child-details', controller.getChildDetails);

module.exports = router;