let mongoose = require('mongoose');
let Reservation = require('../schemas/reservations');
let Cart = require('../schemas/carts');
let Product = require('../schemas/products');
let Inventory = require('../schemas/inventories');

module.exports = {
    // GET all reservations for the current user
    getAllReservations: async function (req, res) {
        try {
            // Assuming req.userId contains the authenticated user ID from checkLogin middleware
            let userId = req.userId;
            let reservations = await Reservation.find({ user: userId })
                .populate('items.product', 'title price')
                .sort({ createdAt: -1 });
            res.json(reservations);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // GET a specific reservation by ID for the current user
    getReservationById: async function (req, res) {
        try {
            let userId = req.userId;
            let reservation = await Reservation.findOne({
                _id: req.params.id,
                user: userId
            })
            .populate('items.product', 'title price');
            
            if (!reservation) {
                return res.status(404).json({ message: 'Reservation not found' });
            }
            res.json(reservation);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // POST reserve a cart (entire cart of the user) - with transaction
    reserveACart: async function (req, res) {
        let session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            let userId = req.userId;
            
            // Get the user's cart
            let cart = await Cart.findOne({ user: userId }).session(session);
            if (!cart || cart.cartItems.length === 0) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: 'Cart is empty' });
            }
            
            // Prepare reservation items from cart
            let reservationItems = [];
            let totalAmount = 0;
            
            for (let cartItem of cart.cartItems) {
                let product = await Product.findById(cartItem.product).session(session);
                if (!product) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(404).json({ message: `Product not found: ${cartItem.product}` });
                }
                
                // Check inventory stock
                let inventory = await Inventory.findOne({ product: cartItem.product }).session(session);
                if (!inventory) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(404).json({ message: `Inventory not found for product: ${product.title}` });
                }
                
                if (inventory.stock < cartItem.quantity) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ 
                        message: `Insufficient stock for product: ${product.title}` 
                    });
                }
                
                // Update inventory: decrease stock, increase reserved
                inventory.stock -= cartItem.quantity;
                inventory.reserved += cartItem.quantity;
                await inventory.save({ session });
                
                let subtotal = product.price * cartItem.quantity;
                reservationItems.push({
                    product: cartItem.product,
                    quantity: cartItem.quantity,
                    title: product.title,
                    price: product.price,
                    subtotal: subtotal
                });
                
                totalAmount += subtotal;
            }
            
            // Create reservation
            let expiredIn = new Date();
            expiredIn.setHours(expiredIn.getHours() + 2); // Example: 2 hours expiry
            
            let reservation = new Reservation({
                user: userId,
                items: reservationItems,
                amount: totalAmount,
                expiredIn: expiredIn
            });
            
            await reservation.save({ session });
            
            // Optionally clear the cart after reservation
            // cart.cartItems = [];
            // await cart.save({ session });
            
            await session.commitTransaction();
            session.endSession();
            
            res.status(201).json(reservation);
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            res.status(500).json({ message: error.message });
        }
    },

    // POST reserve items from a list - with transaction
    reserveItems: async function (req, res) {
        let session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            let userId = req.userId;
            let items = req.body.items; // Expecting { items: [{ productId, quantity }, ...] }
            
            if (!items || !Array.isArray(items) || items.length === 0) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: 'Invalid items list' });
            }
            
            // Prepare reservation items
            let reservationItems = [];
            let totalAmount = 0;
            
            for (let item of items) {
                let product = await Product.findById(item.product).session(session);
                if (!product) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(404).json({ message: `Product not found: ${item.product}` });
                }
                
                // Check inventory stock
                let inventory = await Inventory.findOne({ product: item.product }).session(session);
                if (!inventory) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(404).json({ message: `Inventory not found for product: ${product.title}` });
                }
                
                if (inventory.stock < item.quantity) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ 
                        message: `Insufficient stock for product: ${product.title}` 
                    });
                }
                
                // Update inventory: decrease stock, increase reserved
                inventory.stock -= item.quantity;
                inventory.reserved += item.quantity;
                await inventory.save({ session });
                
                let subtotal = product.price * item.quantity;
                reservationItems.push({
                    product: item.product,
                    quantity: item.quantity,
                    title: product.title,
                    price: product.price,
                    subtotal: subtotal
                });
                
                totalAmount += subtotal;
            }
            
            // Create reservation
            let expiredIn = new Date();
            expiredIn.setHours(expiredIn.getHours() + 2); // Example: 2 hours expiry
            
            let reservation = new Reservation({
                user: userId,
                items: reservationItems,
                amount: totalAmount,
                expiredIn: expiredIn
            });
            
            await reservation.save({ session });
            
            await session.commitTransaction();
            session.endSession();
            
            res.status(201).json(reservation);
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            res.status(500).json({ message: error.message });
        }
    },

    // POST cancel a reservation - with transaction to restore inventory
    cancelReserve: async function (req, res) {
        let session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            let userId = req.userId;
            
            let reservation = await Reservation.findOne({
                _id: req.params.id,
                user: userId,
                status: { $in: ['actived', 'expired'] } // Only allow cancelling active or expired
            }).session(session);
            
            if (!reservation) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ 
                    message: 'Reservation not found or cannot be cancelled' 
                });
            }
            
            // Update inventory: increase stock, decrease reserved
            for (let item of reservation.items) {
                let inventory = await Inventory.findOne({ product: item.product }).session(session);
                if (inventory) {
                    inventory.stock += item.quantity;
                    inventory.reserved -= item.quantity;
                    await inventory.save({ session });
                }
            }
            
            // Update reservation status
            reservation.status = 'cancelled';
            reservation.cancelledAt = new Date();
            await reservation.save({ session });
            
            await session.commitTransaction();
            session.endSession();
            
            res.json(reservation);
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            res.status(500).json({ message: error.message });
        }
    }
};