const Coupon = require('../models/Coupon');
const Book = require('../models/Book');
const {
    isCouponActiveNow,
    computeCouponDiscountAmount
} = require('../utils/couponDiscount');

const normalizeCode = (code) => (code || '').trim().toUpperCase();

const couponController = {
    getAll: async (req, res) => {
        try {
            const coupons = await Coupon.find().sort({ createdAt: -1 });
            res.json(coupons);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const coupon = await Coupon.findById(req.params.id);
            if (!coupon) {
                return res.status(404).json({ message: 'Coupon not found' });
            }
            res.json(coupon);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const { code, description, discountPercent, active, validFrom, validTo, scope, bookIds } = req.body;
            const coupon = new Coupon({
                code: normalizeCode(code),
                description: description || '',
                discountPercent,
                active: active !== undefined ? active : true,
                validFrom: validFrom || null,
                validTo: validTo || null,
                scope: scope || 'ALL',
                bookIds: Array.isArray(bookIds) ? bookIds : []
            });
            await coupon.save();
            res.status(201).json(coupon);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const updates = { ...req.body };
            if (updates.code !== undefined) {
                updates.code = normalizeCode(updates.code);
            }
            const coupon = await Coupon.findByIdAndUpdate(
                req.params.id,
                updates,
                { new: true, runValidators: true }
            );
            if (!coupon) {
                return res.status(404).json({ message: 'Coupon not found' });
            }
            res.json(coupon);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const coupon = await Coupon.findByIdAndDelete(req.params.id);
            if (!coupon) {
                return res.status(404).json({ message: 'Coupon not found' });
            }
            res.json({ message: 'Coupon deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    /**
     * Các mã đang hiệu lực và áp dụng được ít nhất một dòng trong giỏ (cho UI nút chọn).
     */
    availableForCart: async (req, res) => {
        try {
            const { items } = req.body;
            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: 'Items are required' });
            }

            const orderItems = [];
            for (const item of items) {
                const book = await Book.findById(item.bookId);
                if (!book) {
                    return res.status(404).json({ message: `Book ${item.bookId} not found` });
                }
                const price = book.discount > 0
                    ? book.price * (1 - book.discount / 100)
                    : book.price;
                orderItems.push({
                    bookId: book._id,
                    price,
                    quantity: item.quantity
                });
            }

            const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);

            const allCoupons = await Coupon.find({ active: true }).sort({ createdAt: -1 });
            const applicable = [];

            for (const coupon of allCoupons) {
                if (!isCouponActiveNow(coupon)) continue;
                const { eligibleSubtotal, discount } = computeCouponDiscountAmount(coupon, orderItems);
                if (eligibleSubtotal <= 0) continue;
                applicable.push({
                    code: coupon.code,
                    description: coupon.description || '',
                    discountPercent: coupon.discountPercent,
                    subtotal,
                    eligibleSubtotal,
                    couponDiscount: discount,
                    totalPrice: Math.max(0, subtotal - discount)
                });
            }

            res.json({ coupons: applicable });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    /**
     * Preview discount for checkout: items { bookId, quantity }[]
     */
    validate: async (req, res) => {
        try {
            const { couponCode, items } = req.body;
            if (!couponCode || !String(couponCode).trim()) {
                return res.status(400).json({ message: 'Coupon code is required' });
            }
            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: 'Items are required' });
            }

            const coupon = await Coupon.findOne({ code: normalizeCode(couponCode) });
            if (!coupon) {
                return res.status(404).json({ message: 'Invalid coupon code' });
            }
            if (!isCouponActiveNow(coupon)) {
                return res.status(400).json({ message: 'Coupon is not valid at this time' });
            }

            const orderItems = [];
            for (const item of items) {
                const book = await Book.findById(item.bookId);
                if (!book) {
                    return res.status(404).json({ message: `Book ${item.bookId} not found` });
                }
                const price = book.discount > 0
                    ? book.price * (1 - book.discount / 100)
                    : book.price;
                orderItems.push({
                    bookId: book._id,
                    price,
                    quantity: item.quantity
                });
            }

            const { eligibleSubtotal, discount } = computeCouponDiscountAmount(coupon, orderItems);
            if (eligibleSubtotal <= 0) {
                return res.status(400).json({ message: 'Coupon does not apply to these items' });
            }

            const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
            const totalPrice = Math.max(0, subtotal - discount);

            res.json({
                valid: true,
                code: coupon.code,
                discountPercent: coupon.discountPercent,
                subtotal,
                eligibleSubtotal,
                couponDiscount: discount,
                totalPrice
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = couponController;
