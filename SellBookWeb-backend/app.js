const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const createError = require('http-errors');
require('dotenv').config();

let { errorHandler, notFound } = require('./utils/errorHandler');
const ensureAdminAccount = require('./utils/ensureAdminAccount');

const app = express();

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'SellBookWeb-frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sellbookweb')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

mongoose.connection.on('connected', () => {
    console.log('Database connected successfully');
    ensureAdminAccount().catch(err => {
        console.error('Failed to ensure default admin account:', err.message);
    });
});

mongoose.connection.on('error', (err) => {
    console.error('Database connection error:', err);
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/banks', require('./routes/banks'));
app.use('/api/books', require('./routes/books'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/wishlists', require('./routes/wishlists'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API is running' });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
