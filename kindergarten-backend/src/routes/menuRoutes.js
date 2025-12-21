const express = require('express');
const router = express.Router();
const controller = require('../controllers/menuController');

router.post('/', controller.getMenu);
router.post('/add', controller.addMenu);
router.post('/delete', controller.deleteMenu);

module.exports = router;