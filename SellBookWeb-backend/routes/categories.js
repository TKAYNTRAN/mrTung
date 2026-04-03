let express = require('express');
let router = express.Router();
let categoryController = require('../controllers/categories');
let { checkLogin, checkAdmin } = require('../utils/authHandler');

router.get('/', async function (req, res, next) {
    try {
        let categories = await categoryController.getAll();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/admin/all', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let categories = await categoryController.getAllAdmin();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', async function (req, res, next) {
    try {
        let category = await categoryController.getById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let category = await categoryController.create(req.body);
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let category = await categoryController.update(req.params.id, req.body);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', checkLogin, checkAdmin, async function (req, res, next) {
    try {
        let category = await categoryController.delete(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
