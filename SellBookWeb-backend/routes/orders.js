let express = require('express');
let router = express.Router();
let orderController = require('../controllers/orders');
let { checkLogin, checkAdmin } = require('../utils/authHandler');

router.get('/my-orders', checkLogin, async function (req, res, next) {
    try {
        let { page = 0, size = 20 } = req.query;
        let result = await orderController.getMyOrders(req.userId, page, size);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/my-orders/:id', checkLogin, async function (req, res, next) {
    try {
        let order = await orderController.getById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        // Check if order belongs to current user
        if (order.userId._id.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        res.json({ order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', checkLogin, async function (req, res, next) {
    try {
        let { items, shippingAddress, phone, paymentMethod, couponCode, bankId } = req.body;
        let result = await orderController.create(req.userId, items, shippingAddress, phone, paymentMethod, couponCode, bankId);
        res.status(201).json(result);
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('Not enough stock')) {
            return res.status(400).json({ message: error.message });
        }
        if (error.message.includes('Coupon') || error.message.includes('coupon') || error.message.includes('Minimum order')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

router.post('/:id/cancel', checkLogin, async function (req, res, next) {
    try {
        let result = await orderController.cancel(req.params.id, req.userId);
        res.json(result);
    } catch (error) {
        if (error.message === 'Order not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Cannot cancel order that is not pending') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

router.get('/', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let { page = 0, size = 20, status } = req.query;
        let result = await orderController.getAll(page, size, status);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let order = await orderController.getById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json({ order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id/status', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let { status } = req.body;
        let result = await orderController.updateStatus(req.params.id, status);
        if (!result.order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(result);
    } catch (error) {
        if (error.message === 'Cannot change status for cancelled or delivered orders') {
            return res.status(400).json({ message: 'Đơn hàng đã ở trạng thái cuối (Hủy/Đã giao), không thể cập nhật.' });
        }
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
