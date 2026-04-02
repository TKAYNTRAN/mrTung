const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    items: {
        type: [orderItemSchema],
        required: [true, 'Order items are required']
    },
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required'],
        min: [0, 'Total price cannot be negative']
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
        default: 'PENDING'
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'CARD', 'TRANSFER'],
        default: 'COD'
    },
    shippingAddress: {
        type: String,
        required: [true, 'Shipping address is required']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    couponCode: {
        type: String,
        default: ''
    },
    couponDiscount: {
        type: Number,
        default: 0,
        min: [0, 'Coupon discount cannot be negative']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
