var express = require('express');
var router = express.Router();

let orderModel = require('../schemas/orders');
let notificationModel = require('../schemas/notifications');
let { checkLogin, checkRole } = require('../utils/authHandler');

let ALLOWED_ORDER_STATUS = new Set(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']);

function toOrderResponse(order) {
  let obj = order.toObject ? order.toObject() : order;
  return {
    ...obj,
    id: obj._id ? obj._id.toString() : obj.id,
  };
}

router.get('/', checkLogin, checkRole('ADMIN'), async function (req, res) {
  try {
    let page = Math.max(Number(req.query.page) || 0, 0);
    let size = Math.min(Math.max(Number(req.query.size) || 20, 1), 100);

    let orders = await orderModel
      .find({})
      .sort({ createdAt: -1 })
      .skip(page * size)
      .limit(size);

    res.send({
      orders: orders.map(toOrderResponse),
      message: 'Orders retrieved successfully',
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.get('/:id', checkLogin, checkRole('ADMIN'), async function (req, res) {
  try {
    let result = await orderModel.findById(req.params.id);
    if (!result) {
      return res.status(404).send({ message: 'Order not found' });
    }

    res.send({
      order: toOrderResponse(result),
      message: 'Order retrieved successfully',
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.put('/:id/status', checkLogin, checkRole('ADMIN'), async function (req, res) {
  try {
    let status = req.query.status;
    if (!ALLOWED_ORDER_STATUS.has(status)) {
      return res.status(400).send({
        message: 'Invalid status. Allowed values: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED',
      });
    }

    let result = await orderModel.findById(req.params.id);
    if (!result) {
      return res.status(404).send({ message: 'Order not found' });
    }

    result.status = status;
    let updatedItem = await result.save();

    await notificationModel.create({
      userId: updatedItem.userId,
      orderId: updatedItem._id.toString(),
      type: 'ORDER_STATUS_CHANGED',
      title: 'Cáº­p nháº­t tráº¡ng thÃ¡i Ä‘Æ¡n hÃ ng',
      message: `ÄÆ¡n hÃ ng ${updatedItem._id.toString()} Ä‘Ã£ chuyá»ƒn sang tráº¡ng thÃ¡i ${status}.`,
      read: false,
    });

    res.send({
      order: toOrderResponse(updatedItem),
      message: 'Order status updated successfully',
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;

