const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { checkAuth, checkAdmin } = require('../middleware/auth');

router.get('/profile', checkAuth, userController.getProfile);
router.put('/profile', checkAuth, userController.updateProfile);

router.get('/', checkAuth, checkAdmin, userController.getAll);
router.get('/:id', checkAuth, checkAdmin, userController.getById);
router.post('/', checkAuth, checkAdmin, userController.create);
router.put('/:id', checkAuth, checkAdmin, userController.update);
router.delete('/:id', checkAuth, checkAdmin, userController.delete);

module.exports = router;
