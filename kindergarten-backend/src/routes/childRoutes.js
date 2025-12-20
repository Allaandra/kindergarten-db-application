const express = require('express');
const router = express.Router();
const controller = require('../controllers/childController');

router.post('/', controller.getChildren);
router.post('/create', controller.createChild);
router.post('/update', controller.updateChild);
router.post('/delete', controller.deleteChild);

module.exports = router;