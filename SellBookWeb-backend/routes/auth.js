var express = require("express");
var router = express.Router();
let jwt = require('jsonwebtoken')
let bcrypt = require('bcrypt')
let userController = require("../controllers/users")
let userModel = require("../schemas/users")
let { checkLogin } = require('../utils/authHandler')
let crypto = require('crypto')
let { sendMail } = require('../utils/mailHandler')
let mongoose = require('mongoose')

let frontendResetPasswordUrl = process.env.FRONTEND_RESET_PASSWORD_URL || 'http://localhost:5500/pages/login.html';


router.post('/register', async function (req, res, next) {
  let newItem = await userController.CreateAnUser(
    req.body.username,
    req.body.password,
    req.body.email,
    '69a4f929f8d941f2dd234b88'
  )
  res.send(newItem)
});
// Test route for debugging
router.post('/test-login', async function (req, res, next) {
  try {
    let email = req.body.email;
    console.log('Test login for:', email);
    
    // Direct collection query
    let db = mongoose.connection.db;
    let collection = db.collection('users');
    let result = await collection.findOne({ email: email });
    
    console.log('Collection query result:', result ? 'FOUND' : 'NOT FOUND');
    
    if (result) {
      res.send({ message: 'User found', email: result.email, role: result.role });
    } else {
      res.status(401).send({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).send({ message: error.message });
  }
});

router.post('/login', async function (req, res, next) {
  try {
    let email = req.body.email;
    let password = req.body.password;
    
    // Direct query for compatibility - handle both old Java data and new Node.js data
    let result = await userModel.findOne({ email: email });
    if (!result) {
      res.status(401).send({
        message: "Email khÃ´ng tá»“n táº¡i hoáº·c thÃ´ng tin Ä‘Äƒng nháº­p sai"
      })
      return;
    }
    
    // Handle missing username for old users
    if (!result.username) {
      result.username = result.email.split('@')[0]; // Generate username from email
    }
    
    let isMatch = bcrypt.compareSync(password, result.password);
    if (isMatch) {
      let token = jwt.sign({
        id: result._id,
        exp: Date.now() + 3600 * 1000
      }, "HUTECH")
      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000
      });
      res.send({
        accessToken: token,
        refreshToken: token, // For now, same token
        user: {
          id: result._id,
          name: result.name || result.username,
          email: result.email,
          role: result.role,
          phone: result.phone || '',
          avatar: result.avatar,
          active: result.active
        }
      })
    } else {
      res.status(401).send({
        message: "Email khÃ´ng tá»“n táº¡i hoáº·c thÃ´ng tin Ä‘Äƒng nháº­p sai"
      })
    }
  } catch (error) {
    res.status(500).send({
      message: "Lá»—i server"
    })
  }
});
//localhost:3000
router.get('/me', checkLogin, async function (req, res, next) {
  let result = await userController.FindByID(req.userId);
  res.send(result)
});
router.post('/logout', checkLogin, function (req, res, next) {
  res.cookie('token', null, {
    maxAge: 0,
    httpOnly: true
  })
  res.send("logout")
})
router.post('/changepassword', checkLogin, async function (req, res, next) {
  let oldPassword = req.body.oldPassword;
  let newPassword = req.body.newPassword;
  let result = await userController.FindByID(req.userId);
  if (bcrypt.compareSync(oldPassword, result.password)) {
    result.password = newPassword;
  }
  await result.save();
  res.send("da cap nhat password")
})
router.post('/forgotpassword', async function (req, res, next) {
  let email = req.body.email;
  let result = await userController.FindByEmail(email);
  if (result) {
    result.forgotPasswordToken = crypto.randomBytes(31).toString('hex');
    result.forgotPasswordTokenExp = new Date(Date.now() + 10 * 60 * 1000);
    console.log(result.forgotPasswordToken);
    await result.save();
    res.send("gui mail reset pass")

    let resetPasswordLink = `${frontendResetPasswordUrl}?token=${result.forgotPasswordToken}`;
    await sendMail(result.email, resetPasswordLink)
    return;
  }
  res.send("email khong ton tai")
})
router.post('/resetpassword/:token', async function (req, res, next) {
  let token = req.params.token;
  let newPassword = req.body.password;
  let result = await userController.FindByToken(token);
  console.log(result);
  if (result) {
    result.password = newPassword;
    result.forgotPasswordToken = '';
    result.forgotPasswordTokenExp = null;
    await result.save()
    res.send(" da cap nhat")
  } else {
    res.send("loi token")
  }
})


module.exports = router;


//mongodb

