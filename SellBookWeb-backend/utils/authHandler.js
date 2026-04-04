let jwt = require('jsonwebtoken');
let usersController = require('../controllers/users');
let JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

module.exports = {
    checkLogin: function (req, res, next) {
        try {
            let token;
            if (req.cookies.token) {
                token = req.cookies.token;
            } else {
                let authorizationToken = req.headers.authorization;
                if (!authorizationToken || !authorizationToken.startsWith('Bearer ')) {
                    res.status(403).send({
                        message: 'Authentication required'
                    });
                    return;
                }
                token = authorizationToken.split(' ')[1];
            }

            let result = jwt.verify(token, JWT_SECRET);
            req.userId = result.id;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                res.status(403).send({
                    message: 'Token expired'
                });
                return;
            }
            res.status(403).send({
                message: 'Authentication required'
            });
            return;
        }
    },

    checkRole: function (...requiredRoles) {
        return async function (req, res, next) {
            let userId = req.userId;
            let getUser = await usersController.getById(userId);
            if (!getUser) {
                res.status(403).send({
                    message: 'User not found'
                });
                return;
            }

            let roleName = String(getUser.role || '').toUpperCase();
            let normalizedRoles = requiredRoles.map((r) => String(r || '').toUpperCase());
            if (normalizedRoles.includes(roleName)) {
                next();
            } else {
                res.status(403).send({
                    message: 'Insufficient permissions'
                });
            }
        };
    },

    checkAuth: function (req, res, next) {
        module.exports.checkLogin(req, res, next);
    },

    checkAdmin: function (req, res, next) {
        module.exports.checkRole('ADMIN')(req, res, next);
    }
};
