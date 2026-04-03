let express = require('express');
let router = express.Router();
let bookController = require('../controllers/books');
let { checkLogin, checkAdmin } = require('../utils/authHandler');

router.get('/', async function (req, res, next) {
    try {
        let { page = 0, size = 10, category, search, active } = req.query;
        let result = await bookController.getAll(page, size, category, search, active);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/search', async function (req, res, next) {
    try {
        let { title } = req.query;
        let books = await bookController.search(title);
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/category/:categoryId', async function (req, res, next) {
    try {
        let books = await bookController.getByCategory(req.params.categoryId);
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', async function (req, res, next) {
    try {
        let book = await bookController.getById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json(book);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let book = await bookController.create(req.body);
        res.status(201).json(book);
    } catch (error) {
        res.status(500).json({ message: error.message, details: error.errors });
    }
});

router.put('/:id', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let book = await bookController.update(req.params.id, req.body);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json(book);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let book = await bookController.delete(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
