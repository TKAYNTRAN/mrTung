var express = require('express');
var router = express.Router();

let { checkLogin, checkRole } = require('../utils/authHandler');
let productModel = require('../schemas/products');
let categoryModel = require('../schemas/categories');
let userModel = require('../schemas/users');
let reviewModel = require('../schemas/reviews');

router.get('/stats', checkLogin, checkRole('ADMIN'), async function (req, res) {
  try {
    let [totalBooks, totalCategories, totalUsers, pendingReviews] = await Promise.all([
      productModel.countDocuments({ isDeleted: false }),
      categoryModel.countDocuments({ isDeleted: { $ne: true } }),
      userModel.countDocuments({ isDeleted: false }),
      reviewModel.countDocuments({ status: 'pending', isDeleted: false }),
    ]);

    res.send({
      totalBooks,
      totalCategories,
      totalUsers,
      pendingReviews,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;

