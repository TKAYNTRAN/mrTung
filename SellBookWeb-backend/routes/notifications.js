var express = require('express');
var router = express.Router();

let notificationModel = require('../schemas/notifications');
let { checkLogin } = require('../utils/authHandler');

function toNotificationResponse(notification) {
  let obj = notification.toObject ? notification.toObject() : notification;
  return {
    ...obj,
    id: obj._id ? obj._id.toString() : obj.id,
  };
}

router.get('/', checkLogin, async function (req, res) {
  try {
    let userId = req.query.userId;
    if (!userId) {
      return res.status(400).send({ message: 'userId is required' });
    }

    let result = await notificationModel.find({ userId }).sort({ createdAt: -1 });
    res.send(result.map(toNotificationResponse));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.get('/unread', checkLogin, async function (req, res) {
  try {
    let userId = req.query.userId;
    if (!userId) {
      return res.status(400).send({ message: 'userId is required' });
    }

    let result = await notificationModel
      .find({ userId, read: false })
      .sort({ createdAt: -1 });

    res.send(result.map(toNotificationResponse));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.get('/unread-count', checkLogin, async function (req, res) {
  try {
    let userId = req.query.userId;
    if (!userId) {
      return res.status(400).send({ message: 'userId is required' });
    }

    let count = await notificationModel.countDocuments({ userId, read: false });
    res.send({
      count,
      message: 'Unread count retrieved successfully',
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.put('/:id/read', checkLogin, async function (req, res) {
  try {
    let result = await notificationModel.findById(req.params.id);
    if (!result) {
      return res.status(404).send({ message: 'Notification not found' });
    }

    result.read = true;
    result.readAt = new Date();
    let updatedItem = await result.save();

    res.send(toNotificationResponse(updatedItem));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.put('/mark-all-read', checkLogin, async function (req, res) {
  try {
    let userId = req.query.userId;
    if (!userId) {
      return res.status(400).send({ message: 'userId is required' });
    }

    await notificationModel.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );

    res.send({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;

