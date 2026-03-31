var express = require('express');
var router = express.Router();

let couponModel = require('../schemas/coupons');
let { checkLogin, checkRole } = require('../utils/authHandler');

function toCouponResponse(coupon) {
  let obj = coupon.toObject ? coupon.toObject() : coupon;
  return {
    ...obj,
    id: obj._id ? obj._id.toString() : obj.id,
  };
}

router.get('/', async function (req, res) {
  try {
    let result = await couponModel.find({}).sort({ createdAt: -1 });
    res.send(result.map(toCouponResponse));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.get('/code/:code', async function (req, res) {
  try {
    let code = String(req.params.code || '').toUpperCase().trim();
    let result = await couponModel.findOne({ code, active: true });

    if (!result) {
      return res.status(404).send({ message: 'Coupon not found' });
    }

    if (result.expiresAt && result.expiresAt.getTime() < Date.now()) {
      return res.status(400).send({ message: 'Coupon expired' });
    }

    res.send(toCouponResponse(result));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.post('/', checkLogin, checkRole('ADMIN'), async function (req, res) {
  try {
    let code = req.body.code;
    let description = req.body.description;
    let discountType = req.body.discountType;
    let discountValue = req.body.discountValue;
    let active = req.body.active;
    let expiresAt = req.body.expiresAt;
    if (!code) {
      return res.status(400).send({ message: 'code is required' });
    }

    let newItem = await couponModel.create({
      code,
      description: description || '',
      discountType: discountType || 'PERCENTAGE',
      discountValue: Number(discountValue) || 0,
      active: active !== false,
      expiresAt: expiresAt || null,
    });

    res.status(201).send(toCouponResponse(newItem));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;

