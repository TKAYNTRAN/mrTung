let express = require('express');
let router = express.Router();
let purchaseOrderController = require('../controllers/purchaseOrders');
let { checkLogin, checkAdmin } = require('../utils/authHandler');

router.get('/', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let { page = 0, size = 10, status, supplierId } = req.query;
        let result = await purchaseOrderController.getAll(page, size, status, supplierId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let purchaseOrder = await purchaseOrderController.getById(req.params.id);
        if (!purchaseOrder) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }
        res.json(purchaseOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let { supplierId, items, expectedDate, notes } = req.body;
        let purchaseOrder = await purchaseOrderController.create(supplierId, items, expectedDate, notes);
        res.status(201).json(purchaseOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let purchaseOrder = await purchaseOrderController.update(req.params.id, req.body);
        if (!purchaseOrder) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }
        res.json(purchaseOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id/receive', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let purchaseOrder = await purchaseOrderController.receiveOrder(req.params.id);
        res.json(purchaseOrder);
    } catch (error) {
        if (error.message === 'Purchase order not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Order already received' || error.message === 'Cannot receive cancelled order') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id/cancel', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let purchaseOrder = await purchaseOrderController.cancelOrder(req.params.id);
        res.json(purchaseOrder);
    } catch (error) {
        if (error.message === 'Purchase order not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Cannot cancel received order' || error.message === 'Order already cancelled') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let result = await purchaseOrderController.delete(req.params.id);
        res.json(result);
    } catch (error) {
        if (error.message === 'Purchase order not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Cannot delete received order') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
