var express = require('express');
var router = express.Router();

let orderModel = require('../schemas/orders');
let notificationModel = require('../schemas/notifications');
let { checkLogin } = require('../utils/authHandler');

function toOrderResponse(order) {
  let obj = order.toObject ? order.toObject() : order;
  return {
    ...obj,
    id: obj._id ? obj._id.toString() : obj.id,
  };
}

router.post('/', checkLogin, async function (req, res) {
  try {
    let userId = req.body.userId;
    let items = req.body.items;
    let totalPrice = req.body.totalPrice;
    let status = req.body.status;
    let paymentMethod = req.body.paymentMethod;
    let shippingAddress = req.body.shippingAddress;
    let phone = req.body.phone;

    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).send({ message: 'userId and items are required' });
    }

    let newItem = new orderModel({
      userId,
      items,
      totalPrice: Number(totalPrice) || 0,
      status: status || 'PENDING',
      paymentMethod: paymentMethod || 'COD',
      shippingAddress: shippingAddress || '',
      phone: phone || '',
    });

    let result = await newItem.save();

    await notificationModel.create({
      userId,
      orderId: result._id.toString(),
      type: 'NEW_ORDER',
      title: 'Äáº·t hÃ ng thÃ nh cÃ´ng',
      message: `ÄÆ¡n hÃ ng ${result._id.toString()} cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c táº¡o.`,
      read: false,
    });

    res.status(201).send(toOrderResponse(result));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.get('/', checkLogin, async function (req, res) {
  try {
    let userId = req.query.userId;
    if (!userId) {
      return res.status(400).send({ message: 'userId is required' });
    }

    let orders = await orderModel.find({ userId }).sort({ createdAt: -1 });
    res.send(orders.map(toOrderResponse));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.put('/:id/cancel', checkLogin, async function (req, res) {
  try {
    let result = await orderModel.findById(req.params.id);
    if (!result) {
      return res.status(404).send({ message: 'Order not found' });
    }

    if (result.status === 'CANCELLED') {
      return res.send(toOrderResponse(result));
    }

    result.status = 'CANCELLED';
    let updatedItem = await result.save();

    await notificationModel.create({
      userId: result.userId,
      orderId: updatedItem._id.toString(),
      type: 'ORDER_STATUS_CHANGED',
      title: 'ÄÆ¡n hÃ ng Ä‘Ã£ há»§y',
      message: `ÄÆ¡n hÃ ng ${updatedItem._id.toString()} Ä‘Ã£ Ä‘Æ°á»£c há»§y.`,
      read: false,
    });

    res.send(toOrderResponse(updatedItem));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;

