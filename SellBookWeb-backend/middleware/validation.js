const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

const userValidation = {
    register: [
        body('name')
            .trim()
            .isLength({ min: 2 })
            .withMessage('Name must be at least 2 characters'),
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Invalid email format'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        body('phone')
            .optional()
            .matches(/^[0-9]{10}$/)
            .withMessage('Phone must be 10 digits'),
        handleValidationErrors
    ],
    login: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Invalid email format'),
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
        handleValidationErrors
    ]
};

const bookValidation = {
    create: [
        body('title')
            .trim()
            .notEmpty()
            .withMessage('Title is required'),
        body('author')
            .trim()
            .notEmpty()
            .withMessage('Author is required'),
        body('price')
            .isFloat({ min: 0 })
            .withMessage('Price must be a positive number'),
        body('quantity')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Quantity must be a non-negative integer'),
        body('categoryId')
            .notEmpty()
            .withMessage('Category is required'),
        handleValidationErrors
    ]
};

const orderValidation = {
    create: [
        body('items')
            .isArray({ min: 1 })
            .withMessage('Order must have at least one item'),
        body('items.*.bookId')
            .notEmpty()
            .withMessage('Book ID is required for each item'),
        body('items.*.quantity')
            .isInt({ min: 1 })
            .withMessage('Quantity must be at least 1'),
        body('shippingAddress')
            .trim()
            .notEmpty()
            .withMessage('Shipping address is required'),
        body('phone')
            .matches(/^[0-9]{10}$/)
            .withMessage('Phone must be 10 digits'),
        body('couponCode')
            .optional({ values: 'falsy' })
            .isString()
            .trim(),
        handleValidationErrors
    ]
};

module.exports = {
    userValidation,
    bookValidation,
    orderValidation
};
