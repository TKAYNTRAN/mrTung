let express = require('express');
let router = express.Router();
let reviewController = require('../controllers/reviews');
let Review = require('../models/Review');
let usersController = require('../controllers/users');
let { checkAuth, checkAdmin } = require('../utils/authHandler');

router.get('/book/:bookId', async function (req, res, next) {
    try {
        let reviews = await reviewController.getByBook(req.params.bookId);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/user/:userId', checkAuth, async function (req, res, next) {
    try {
        let reviews = await reviewController.getByUser(req.params.userId);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', checkAuth, async function (req, res, next) {
    try {
        let { bookId, rating, comment } = req.body;
        let user = await usersController.getById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let result = await reviewController.create(req.userId, user.name, bookId, rating, comment);
        res.status(201).json(result);
    } catch (error) {
        if (error.message === 'Book not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'You have already reviewed this book') {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', checkAuth, async function (req, res, next) {
    try {
        let review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        let user = await usersController.getById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (review.userId.toString() !== req.userId.toString() &&
            user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        let result = await reviewController.delete(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/admin/pending', checkAuth, checkAdmin, async function (req, res, next) {
    try {
        let reviews = await reviewController.getPending();
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id/approve', checkAuth, checkAdmin, async function (req, res, next) {
    try {
        let result = await reviewController.approve(req.params.id);
        res.json(result);
    } catch (error) {
        if (error.message === 'Review not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
