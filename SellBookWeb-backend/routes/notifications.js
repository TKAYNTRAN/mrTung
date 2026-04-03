let express = require('express');
let router = express.Router();
let notificationController = require('../controllers/notifications');
let { checkLogin, checkAdmin } = require('../utils/authHandler');

router.get('/', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let { page = 0, size = 10, userId, read } = req.query;
        let result = await notificationController.getAll(page, size, userId, read);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/my-notifications', checkLogin, async function (req, res, next) {
    try {
        let { page = 0, size = 10, read } = req.query;
        let result = await notificationController.getMyNotifications(req.userId, page, size, read);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', checkLogin, async function (req, res, next) {
    try {
        let notification = await notificationController.getById(req.params.id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let notification = await notificationController.create(req.body);
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id/read', checkLogin, async function (req, res, next) {
    try {
        let notification = await notificationController.markAsRead(req.params.id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/mark-all-read', checkLogin, async function (req, res, next) {
    try {
        let result = await notificationController.markAllAsRead(req.userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', checkLogin, async function (req, res, next) {
    try {
        let notification = await notificationController.delete(req.params.id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/read/all', checkLogin, async function (req, res, next) {
    try {
        let result = await notificationController.deleteAllRead(req.userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
