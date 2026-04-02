const User = require('../models/User');

const userController = {
    getAll: async (req, res) => {
        try {
            const users = await User.find().select('-password').sort({ createdAt: -1 });
            res.json(users);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const user = await User.findById(req.params.id).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.userId).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const u = user.toObject();
            u.id = user._id;
            res.json(u);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const { name, email, password, phone, role, active } = req.body;

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({ message: 'Email already registered' });
            }

            const user = new User({
                name,
                email,
                password,
                phone: phone || '',
                role: role || 'CUSTOMER',
                active: active !== undefined ? active : true
            });

            await user.save();

            res.status(201).json({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                active: user.active
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const updates = req.body;
            delete updates.password;

            const user = await User.findByIdAndUpdate(
                req.params.id,
                updates,
                { new: true, runValidators: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const user = await User.findByIdAndDelete(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateProfile: async (req, res) => {
        try {
            const { name, phone, avatar } = req.body;
            const user = await User.findByIdAndUpdate(
                req.userId,
                { name, phone, avatar },
                { new: true, runValidators: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const u = user.toObject();
            u.id = user._id;
            res.json(u);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = userController;
