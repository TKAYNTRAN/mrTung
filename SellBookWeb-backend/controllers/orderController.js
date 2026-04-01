const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const Coupon = require('../models/Coupon');
const {
    isCouponActiveNow,
    computeCouponDiscountAmount
} = require('../utils/couponDiscount');

const normalizeCouponCode = (code) => (code || '').trim().toUpperCase();

const orderController = {
    getAll: async (req, res) => {
        try {
            const { page = 0, size = 20, status } = req.query;
            const query = {};
            if (status) query.status = status;

            const orders = await Order.find(query)
                .populate('userId', 'name email')
                .populate('items.bookId', 'title image')
                .sort({ createdAt: -1 })
                .skip(page * size)
                .limit(parseInt(size));

            const total = await Order.countDocuments(query);

            res.json({
                orders,
                pagination: {
                    page: parseInt(page),
                    size: parseInt(size),
                    total,
                    totalPages: Math.ceil(total / size)
                }
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const order = await Order.findById(req.params.id)
                .populate('userId', 'name email phone')
                .populate('items.bookId', 'title image author');

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.json({ order });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getMyOrders: async (req, res) => {
        try {
            const { page = 0, size = 20 } = req.query;

            const orders = await Order.find({ userId: req.userId })
                .populate('items.bookId', 'title image')
                .sort({ createdAt: -1 })
                .skip(page * size)
                .limit(parseInt(size));

            const total = await Order.countDocuments({ userId: req.userId });

            res.json({
                orders,
                pagination: {
                    page: parseInt(page),
                    size: parseInt(size),
                    total,
                    totalPages: Math.ceil(total / size)
                }
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const { items, shippingAddress, phone, paymentMethod, couponCode } = req.body;

            let subtotal = 0;
            const orderItems = [];

            for (const item of items) {
                const book = await Book.findById(item.bookId);
                if (!book) {
                    return res.status(404).json({ message: `Book ${item.bookId} not found` });
                }
                if (book.quantity < item.quantity) {
                    return res.status(400).json({ message: `Not enough stock for ${book.title}` });
                }

                const price = book.discount > 0
                    ? book.price * (1 - book.discount / 100)
                    : book.price;

                orderItems.push({
                    bookId: book._id,
                    title: book.title,
                    price: price,
                    quantity: item.quantity
                });

                subtotal += price * item.quantity;

                book.quantity -= item.quantity;
                book.salesCount += item.quantity;
                await book.save();
            }

            let couponDiscount = 0;
            let appliedCouponCode = '';

            if (couponCode && String(couponCode).trim()) {
                const code = normalizeCouponCode(couponCode);
                const coupon = await Coupon.findOne({ code });
                if (!coupon) {
                    return res.status(400).json({ message: 'Invalid coupon code' });
                }
                if (!isCouponActiveNow(coupon)) {
                    return res.status(400).json({ message: 'Coupon is not valid at this time' });
                }
                const pricedForCoupon = orderItems.map((oi) => ({
                    bookId: oi.bookId,
                    price: oi.price,
                    quantity: oi.quantity
                }));
                const { eligibleSubtotal, discount } = computeCouponDiscountAmount(coupon, pricedForCoupon);
                if (eligibleSubtotal <= 0) {
                    return res.status(400).json({ message: 'Coupon does not apply to items in this order' });
                }
                couponDiscount = discount;
                appliedCouponCode = coupon.code;
            }

            const totalPrice = Math.max(0, subtotal - couponDiscount);

            const order = new Order({
                userId: req.userId,
                items: orderItems,
                totalPrice,
                couponCode: appliedCouponCode,
                couponDiscount,
                shippingAddress,
                phone,
                paymentMethod: paymentMethod || 'COD',
                status: 'PENDING'
            });

            await order.save();

            await Cart.findOneAndUpdate(
                { userId: req.userId },
                { $set: { items: [], totalPrice: 0 } }
            );

            res.status(201).json({
                message: 'Order placed successfully',
                order
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const order = await Order.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true, runValidators: true }
            );

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.json({ message: 'Order status updated', order });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    cancel: async (req, res) => {
        try {
            const order = await Order.findOne({ _id: req.params.id, userId: req.userId });
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            if (order.status !== 'PENDING') {
                return res.status(400).json({ message: 'Cannot cancel order that is not pending' });
            }

            for (const item of order.items) {
                const book = await Book.findById(item.bookId);
                if (book) {
                    book.quantity += item.quantity;
                    book.salesCount -= item.quantity;
                    await book.save();
                }
            }

            order.status = 'CANCELLED';
            await order.save();

            res.json({ message: 'Order cancelled successfully', order });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = orderController;
