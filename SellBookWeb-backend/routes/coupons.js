let express = require('express');
let router = express.Router();
let couponController = require('../controllers/coupons');
let { checkLogin, checkAdmin } = require('../utils/authHandler');

router.get('/', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let { page = 0, size = 10, active, search } = req.query;
        let result = await couponController.getAll(page, size, active, search);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/code/:code', async function (req, res, next) {
    try {
        let coupon = await couponController.getByCode(req.params.code);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        res.json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/available-for-cart', async function (req, res, next) {
    try {
        let { items } = req.body;
        let result = await couponController.availableForCart(items || []);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let coupon = await couponController.getById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        res.json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let coupon = await couponController.create(req.body);
        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/validate', async function (req, res, next) {
    try {
        let { code, orderAmount } = req.body;
        let result = await couponController.validate(code, orderAmount);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/:id', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let coupon = await couponController.update(req.params.id, req.body);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        res.json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let coupon = await couponController.delete(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
