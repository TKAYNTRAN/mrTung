let express = require('express');
let router = express.Router();
let cartController = require('../controllers/carts');
let { checkLogin } = require('../utils/authHandler');

router.get('/', checkLogin, async function (req, res, next) {
    try {
        let cart = await cartController.getMyCart(req.userId);
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/items', checkLogin, async function (req, res, next) {
    try {
        let { bookId, quantity } = req.body;
        let result = await cartController.addItem(req.userId, bookId, quantity);
        res.json(result);
    } catch (error) {
        if (error.message === 'Book not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not enough stock') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

router.put('/items/:bookId', checkLogin, async function (req, res, next) {
    try {
        let { quantity } = req.body;
        let result = await cartController.updateItem(req.userId, req.params.bookId, quantity);
        res.json(result);
    } catch (error) {
        if (error.message === 'Cart not found' || error.message === 'Item not found in cart') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

router.delete('/items/:bookId', checkLogin, async function (req, res, next) {
    try {
        let result = await cartController.removeItem(req.userId, req.params.bookId);
        res.json(result);
    } catch (error) {
        if (error.message === 'Cart not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

router.delete('/', checkLogin, async function (req, res, next) {
    try {
        let result = await cartController.clearCart(req.userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
