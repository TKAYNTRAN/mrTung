const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { checkAuth, checkAdmin } = require('../middleware/auth');

router.post('/validate', checkAuth, couponController.validate);
router.post('/available-for-cart', checkAuth, couponController.availableForCart);

router.get('/', checkAuth, checkAdmin, couponController.getAll);
router.get('/:id', checkAuth, checkAdmin, couponController.getById);
router.post('/', checkAuth, checkAdmin, couponController.create);
router.put('/:id', checkAuth, checkAdmin, couponController.update);
router.delete('/:id', checkAuth, checkAdmin, couponController.delete);

module.exports = router;
