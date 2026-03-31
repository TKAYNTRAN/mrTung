var express = require("express");
var router = express.Router();
let { userPostValidation, validateResult } =
  require('../utils/validationHandler');
let { checkLogin, checkRole } = require('../utils/authHandler');
let userModel = require('../schemas/users');
let cartModel = require('../schemas/carts');
let mongoose = require('mongoose');

let userController = require("../controllers/users");


router.get("/", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  let result = await userController.getAllUser();
  res.send(result);
});

router.get("/:id", checkLogin, checkRole("ADMIN", "MODERATOR"), async function (req, res, next) {
  try {
    let result = await userController.FindByID(req.params.id);
    if (result) {
      res.send(result);
    }
    else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.post("/", userPostValidation, validateResult,
  async function (req, res, next) {
    let session = await mongoose.startSession();
    try {
      session.startTransaction();

      let newItem = await userController.CreateAnUser(
        req.body.username,
        req.body.password,
        req.body.email,
        req.body.role,
        "", "",
        false,
        session
      );

      let newCart = new cartModel({
        user: newItem._id
      });

      let result = await newCart.save({ session });
      await result.populate('user');

      await session.commitTransaction();
      res.send(result);
    } catch (err) {
      await session.abortTransaction();
      res.status(400).send({ message: err.message });
    } finally {
      session.endSession();
    }
  });

router.put("/:id", async function (req, res, next) {
  try {
    let userId = req.params.id;
    let result = await userModel.findOne({ _id: userId, isDeleted: false });
    if (!result) return res.status(404).send({ message: "id not found" });

    let updateKeys = Object.keys(req.body);
    for (let key of updateKeys) {
      result[key] = req.body[key];
    }

    await result.save();
    let updatedItem = await userModel.findById(result._id);
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});
router.delete("/:id", async function (req, res, next) {
  try {
    let userId = req.params.id;
    let deletedItem = await userModel.findByIdAndUpdate(
      userId,
      { isDeleted: true },
      { new: true }
    );
    if (!deletedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(deletedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
