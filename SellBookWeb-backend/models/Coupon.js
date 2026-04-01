const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Code is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    description: {
        type: String,
        default: ''
    },
    discountPercent: {
        type: Number,
        required: [true, 'Discount percent is required'],
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100']
    },
    active: {
        type: Boolean,
        default: true
    },
    validFrom: {
        type: Date,
        default: null
    },
    validTo: {
        type: Date,
        default: null
    },
    scope: {
        type: String,
        enum: ['ALL', 'ONLY_BOOKS', 'EXCEPT_BOOKS'],
        default: 'ALL'
    },
    bookIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
