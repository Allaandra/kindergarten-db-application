const express = require('express');
const router = express.Router();
const controller = require('../controllers/dishController');

router.post('/', controller.getDishes);
router.post('/add', controller.addDish);
router.post('/delete', controller.deleteDish);

module.exports = router;