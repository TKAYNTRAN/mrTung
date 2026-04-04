const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '24h' });
};

module.exports = {
    register: async function (name, email, password, phone) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('Email already registered');
        }

        const user = new User({
            name,
            email,
            password,
            phone: phone || '',
            role: 'CUSTOMER',
            active: true
        });

        await user.save();

        const token = generateToken(user._id);

        return {
            message: 'User registered successfully',
            accessToken: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            }
        };
    },

    login: async function (email, password) {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Invalid email or password');
        }

        if (!user.active) {
            throw new Error('Account is banned');
        }

        const isMatch = user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }
        const token = generateToken(user._id);

        return {
            accessToken: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                avatar: user.avatar
            }
        };
    },

    getProfile: async function (userId) {
        return await User.findById(userId).select('-password');
    },

    logout: async function () {
        return { message: 'Logged out successfully' };
    }
};
