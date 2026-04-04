const User = require('../models/User');

const DEFAULT_ADMIN = {
    name: process.env.DEFAULT_ADMIN_NAME || 'System Admin',
    email: (process.env.DEFAULT_ADMIN_EMAIL || 'admin@bookstore.com').toLowerCase(),
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
    phone: process.env.DEFAULT_ADMIN_PHONE || '',
    role: 'ADMIN'
};

let ensureAdminPromise = null;

async function ensureAdminAccount() {
    if (ensureAdminPromise) {
        return ensureAdminPromise;
    }

    ensureAdminPromise = (async () => {
        const existingAdmin = await User.findOne({
            role: 'ADMIN'
        }).select('_id email role');

        if (existingAdmin) {
            return existingAdmin;
        }

        const existingByEmail = await User.findOne({ email: DEFAULT_ADMIN.email });
        if (existingByEmail) {
            existingByEmail.role = DEFAULT_ADMIN.role;
            existingByEmail.active = true;
            await existingByEmail.save();
            console.log(`Promoted existing user ${DEFAULT_ADMIN.email} to ${DEFAULT_ADMIN.role}`);
            return existingByEmail;
        }

        const adminUser = new User({
            name: DEFAULT_ADMIN.name,
            email: DEFAULT_ADMIN.email,
            password: DEFAULT_ADMIN.password,
            phone: DEFAULT_ADMIN.phone,
            role: DEFAULT_ADMIN.role,
            active: true
        });

        await adminUser.save();
        console.log(`Created default admin account: ${DEFAULT_ADMIN.email}`);
        if (!process.env.DEFAULT_ADMIN_PASSWORD) {
            console.log('Default admin password is admin123. Change it after first login.');
        }

        return adminUser;
    })();

    try {
        return await ensureAdminPromise;
    } catch (error) {
        ensureAdminPromise = null;
        throw error;
    }
}

module.exports = ensureAdminAccount;