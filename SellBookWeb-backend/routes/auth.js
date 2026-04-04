let express = require('express');
let router = express.Router();
let authController = require('../controllers/auth');
let { checkLogin } = require('../utils/authHandler');

router.post('/register', async function (req, res, next) {
    try {
        const { name, email, password, phone } = req.body;
        const result = await authController.register(name, email, password, phone);
        res.status(201).json(result);
    } catch (error) {
        if (error.message === 'Email already registered') {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

router.post('/login', async function (req, res, next) {
    try {
        const { email, password } = req.body;
        const result = await authController.login(email, password);
        res.json(result);
    } catch (error) {
        if (error.message === 'Invalid email or password' || error.message === 'Account is banned') {
            return res.status(401).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

router.get('/me', checkLogin, async function (req, res, next) {
    try {
        const user = await authController.getProfile(req.userId);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/logout', checkLogin, async function (req, res, next) {
    try {
        const result = await authController.logout();
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
