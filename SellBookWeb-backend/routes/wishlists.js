let express = require('express');
let router = express.Router();
let wishlistController = require('../controllers/wishlists');
let { checkLogin } = require('../utils/authHandler');

router.get('/', checkLogin, async function (req, res, next) {
    try {
        let wishlist = await wishlistController.getMyWishlist(req.userId);
        res.json(wishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/check/:bookId', checkLogin, async function (req, res, next) {
    try {
        let result = await wishlistController.checkInWishlist(req.userId, req.params.bookId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', checkLogin, async function (req, res, next) {
    try {
        let { bookId } = req.body;
        let wishlist = await wishlistController.addToWishlist(req.userId, bookId);
        res.json(wishlist);
    } catch (error) {
        if (error.message === 'Book not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Book already in wishlist') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:bookId', checkLogin, async function (req, res, next) {
    try {
        let wishlist = await wishlistController.removeFromWishlist(req.userId, req.params.bookId);
        res.json(wishlist);
    } catch (error) {
        if (error.message === 'Wishlist not found' || error.message === 'Book not found in wishlist') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

router.delete('/', checkLogin, async function (req, res, next) {
    try {
        let result = await wishlistController.clearWishlist(req.userId);
        res.json(result);
    } catch (error) {
        if (error.message === 'Wishlist not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
