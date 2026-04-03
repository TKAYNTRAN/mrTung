let express = require('express');
let router = express.Router();
let paymentController = require('../controllers/payments');
let { checkLogin, checkAdmin } = require('../utils/authHandler');

router.get('/', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let { page = 0, size = 10, status, orderId } = req.query;
        let result = await paymentController.getAll(page, size, status, orderId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/order/:orderId', checkLogin, async function (req, res, next) {
    try {
        let payments = await paymentController.getByOrderId(req.params.orderId);
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', checkLogin, async function (req, res, next) {
    try {
        let payment = await paymentController.getById(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', checkLogin, async function (req, res, next) {
    try {
        let payment = await paymentController.create(req.body);
        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id/status', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let { paymentStatus, transactionId } = req.body;
        let payment = await paymentController.updateStatus(req.params.id, paymentStatus, transactionId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id/refund', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let payment = await paymentController.processRefund(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let payment = await paymentController.delete(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
