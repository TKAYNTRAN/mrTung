var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let mongoose = require('mongoose');


var app = express();
let cors = require('cors');
// Frontend is static HTML and is commonly served by Live Server (5500) / python http.server (8000)
// We use Bearer tokens (not cookies), so credentials are not required.
let allowedOrigins = new Set([
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

app.use(cors({
  origin: function (origin, cb) {
    // Allow same-origin or non-browser clients (origin undefined),
    // and allow file:// (origin "null") for quick local testing.
    if (!origin || origin === 'null' || allowedOrigins.has(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Test route to verify server is working
app.get('/api/test', function (req, res) {
  res.send('API is working');
});

mongoose.connect('mongodb://localhost:27017/test');
mongoose.connection.on('connected', function () {
  console.log("da connect");
})

// All API routes under /api
app.use('/api', require('./routes/index'));
app.use('/api/users', require('./routes/users'));
app.use('/api/roles', require('./routes/roles'));
console.log('Loading auth routes');
app.use('/api/auth', require('./routes/auth'));
console.log('Auth routes loaded');
app.use('/api/carts', require('./routes/carts'));
app.use('/api/cart', require('./routes/carts'));
app.use('/api/books', require('./routes/products'));   // renamed to books
app.use('/api/admin/books', require('./routes/products'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/categories', require('./routes/categories')); // new
app.use('/api/admin/categories', require('./routes/categories'));
app.use('/api/reviews', require('./routes/reviews'));       // new
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin/orders', require('./routes/adminOrders'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin/users', require('./routes/adminUsers'));
app.use('/api/admin/dashboard', require('./routes/adminDashboard'));
app.use('/api/coupons', require('./routes/coupons'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  //res.render('error');
  res.send({
    message: err.message
  });
});

module.exports = app;

