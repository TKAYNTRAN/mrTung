let express = require('express');
let router = express.Router();
let userController = require('../controllers/users');
let { checkLogin, checkAdmin } = require('../utils/authHandler');

router.get('/profile', checkLogin, async function (req, res, next) {
    try {
        const user = await userController.getById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/profile', checkLogin, async function (req, res, next) {
    try {
        const { name, phone, avatar } = req.body;
        const user = await userController.updateProfile(req.userId, name, phone, avatar);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        const users = await userController.getAll();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        const user = await userController.getById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

router.post('/', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        const { name, email, password, phone, role, active } = req.body;
        const user = await userController.create(name, email, password, phone, role, active);
        res.status(201).json(user);
    } catch (error) {
        if (error.message === 'Email already registered') {
            return res.status(409).json({ message: error.message });
        }
        res.status(400).json({ message: error.message });
    }
});

router.put('/:id', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        const user = await userController.update(req.params.id, req.body);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:id', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        const user = await userController.delete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
