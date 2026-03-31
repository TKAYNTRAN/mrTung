var express = require('express');
var router = express.Router();
let productModel = require('../schemas/products');
let inventoryModel = require('../schemas/inventories');
let { ConvertTitleToSlug } = require('../utils/titleHandler');

function mapProductResponse(product) {
  let productObject = product.toObject();
  return {
    ...productObject,
    id: productObject._id.toString(),
  };
}

function normalizeCategoryId(categoryId) {
  if (categoryId === 'undefined' || categoryId === '') {
    return null;
  }
  return categoryId;
}

//getall
router.get('/', async function (req, res, next) {
  try {
    let products = await productModel.find({ isDeleted: false });
    res.send(products.map(mapProductResponse));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

//get by ID
router.get('/:id', async function (req, res, next) {
  try {
    let product = await productModel.findById(req.params.id);
    if (product) {
      res.send(mapProductResponse(product));
    } else {
      res.status(404).send({
        message: "id not found"
      });
    }
  } catch (error) {
    res.status(404).send({
      message: "id not found"
    });
  }
});

router.post('/', async function (req, res, next) {
  try {
    let newProductInput = new productModel({
      title: req.body.title,
      slug: ConvertTitleToSlug(req.body.title),
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      author: req.body.author || "",
      quantity: req.body.quantity || 0,
      categoryId: normalizeCategoryId(req.body.categoryId),
      image: req.body.image,
      supplierName: req.body.supplierName || "",
      coverType: req.body.coverType || "BÃ¬a má»m",
      translator: req.body.translator || "None",
      publisher: req.body.publisher || "",
      discountCode: req.body.discountCode || "None"
    });
    
    let createdProduct = await newProductInput.save();
    
    // Create inventory without transaction
    try {
      let newInventory = new inventoryModel({
        product: createdProduct._id,
        stock: req.body.quantity || 1
      });
      await newInventory.save();
    } catch (invError) {
      console.log('Inventory creation failed:', invError.message);
    }
    
    res.send(mapProductResponse(createdProduct));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.put('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let updateData = { ...req.body, categoryId: normalizeCategoryId(req.body.categoryId) };
    
    let updatedProduct = await productModel.findByIdAndUpdate(
      id,
      updateData,
      {
      new: true
    });

    if (!updatedProduct) {
      return res.status(404).send({ message: 'id not found' });
    }

    res.send(mapProductResponse(updatedProduct));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.delete('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let deletedProduct = await productModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!deletedProduct) {
      return res.status(404).send({ message: 'id not found' });
    }

    res.send(mapProductResponse(deletedProduct));
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;

