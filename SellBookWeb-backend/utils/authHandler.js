let jwt = require('jsonwebtoken')
let userController = require("../controllers/users");
module.exports = {
    checkLogin: function (req, res, next) {
        try {
            let token;
            if (req.cookies.token) {
                token = req.cookies.token
            }
            else {
                let authorizationToken = req.headers.authorization;
                if (!authorizationToken || !authorizationToken.startsWith("Bearer")) {
                    res.status(403).send({
                        message: "ban chua dang nhap"
                    })
                    return;
                }
                token = authorizationToken.split(' ')[1];
            }
            let result = jwt.verify(token, 'HUTECH');
            if (result.exp > Date.now()) {
                req.userId = result.id;
                next();
            } else {
                res.status(403).send({
                    message: "ban chua dang nhap"
                })
            }
        } catch (error) {
            res.status(403).send({
                message: "ban chua dang nhap"
            })
            return;
        }
    },
    checkRole: function (...requiredRole) {
        return async function (req, res, next) {
            let userId = req.userId;
            let getUser = await userController.FindByID(userId);
            if (!getUser) {
                res.status(403).send({
                    message: "ban khong co quyen"
                })
                return;
            }
            let userRole = getUser.role;
            
            // Role hierarchy: SUPER_ADMIN can access all ADMIN endpoints
            let roleHierarchy = {
                'CUSTOMER': 0,
                'ADMIN': 1,
                'SUPER_ADMIN': 2
            };
            
            let hasPermission = false;
            for (let i = 0; i < requiredRole.length; i++) {
                if (userRole === requiredRole[i]) {
                    hasPermission = true;
                    break;
                }
                // SUPER_ADMIN can act as ADMIN
                if (userRole === 'SUPER_ADMIN' && requiredRole[i] === 'ADMIN') {
                    hasPermission = true;
                    break;
                }
            }
            
            if (hasPermission) {
                next()
            } else {
                res.status(403).send({
                    message: "ban khong co quyen"
                })
            }
        }
    }
}