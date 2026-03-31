var express = require('express');
var router = express.Router();
let categoryModel = require('../schemas/categories')
let { ConvertTitleToSlug } = require('../utils/titleHandler')
let { getMaxID } = require('../utils/IdHandler');
let { default: mongoose } = require('mongoose');

//getall
router.get('/', async function (req, res, next) {
  try {
    let categories = await categoryModel.find({
        $or: [
            { isDeleted: false },
            { isDeleted: { $exists: false } },
            { isDeleted: null }
        ]
    });
    // Add id field for frontend compatibility
    let formattedCategories = categories.map(function (category) {
      return {
        ...category.toObject(),
        id: category._id.toString()
      };
    });
    res.send(formattedCategories)
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

//get by ID
router.get('/:id', async function (req, res, next) {
  try {
    let result = await categoryModel.findById(req.params.id);
    if (result) {
      // Add id field for frontend compatibility
      let formattedResult = {
        ...result.toObject(),
        id: result._id.toString()
      };
      res.send(formattedResult)
    } else {
      res.status(404).send({
        message: "id not found"
      })
    }
  } catch (error) {
    res.status(404).send({
      message: "id not found"
    })
  }
});

router.post('/', async function (req, res, next) {
  let session = await mongoose.startSession();
  let transaction = session.startTransaction()
  try {
    let newItem = new categoryModel({
      name: req.body.name,
      slug: ConvertTitleToSlug(req.body.name),
      description: req.body.description || ''
    })
    let newCategory = await newItem.save({ session });
    await session.commitTransaction()
    session.endSession()
    res.send(newCategory);
  } catch (error) {
    await session.abortTransaction();
    session.endSession()
    res.status(500).send({ message: error.message });
  }
});

router.put('/:id', async function (req, res, next) {
  let id = req.params.id;
  let updatedItem = await categoryModel.findByIdAndUpdate(
    id, req.body, {
    new: true
  }
  )
  res.send(updatedItem)
});

router.delete('/:id', async function (req, res, next) {
  let id = req.params.id;
  let updatedItem = await categoryModel.findByIdAndUpdate(
    id, {
    isDeleted: true
  }, {
    new: true
  }
  )
  res.send(updatedItem)
});

module.exports = router;
