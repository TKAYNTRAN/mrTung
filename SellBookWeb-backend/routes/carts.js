var express = require("express");
var router = express.Router();
let { checkLogin } = require('../utils/authHandler');
let cartModel = require('../schemas/carts');
let inventoryModel = require('../schemas/inventories');

function sendProductNotFound(res) {
    return res.status(404).send({ message: 'product khong ton tai' });
}

async function getUserCart(userId) {
    return await cartModel.findOne({ user: userId });
}

async function productExists(productId) {
    let inventory = await inventoryModel.findOne({ product: productId });
    return !!inventory;
}

function findCartItemIndex(cart, productId) {
    return cart.cartItems.findIndex(function (item) {
        return item.product == productId;
    });
}

router.get('/get-cart', checkLogin, async function (req, res) {
    let result = await getUserCart(req.userId);
    if (!result) {
        return res.send([]);
    }
    res.send(result.cartItems);
});

router.post('/add-cart', checkLogin, async function (req, res) {
    let productId = req.body.product;
    let quantity = req.body.quantity;
    let result = await getUserCart(req.userId);
    if (!result) {
        return res.status(404).send({ message: 'cart not found' });
    }

    if (!(await productExists(productId))) {
        return sendProductNotFound(res);
    }

    let addQuantity = Math.max(Number(quantity) || 1, 1);
    let itemIndex = findCartItemIndex(result, productId);

    if (itemIndex === -1) {
        result.cartItems.push({ product: productId, quantity: addQuantity });
    } else {
        result.cartItems[itemIndex].quantity += addQuantity;
    }

    await result.save();
    res.send(result);
});

router.post('/add-one', checkLogin, async function (req, res) {
    let productId = req.body.product;
    let result = await getUserCart(req.userId);
    if (!result) {
        return res.status(404).send({ message: 'cart not found' });
    }

    if (!(await productExists(productId))) {
        return sendProductNotFound(res);
    }

    let itemIndex = findCartItemIndex(result, productId);
    if (itemIndex === -1) {
        result.cartItems.push({ product: productId, quantity: 1 });
    } else {
        result.cartItems[itemIndex].quantity += 1;
    }

    await result.save();
    res.send(result);
});

router.post('/reduce', checkLogin, async function (req, res) {
    let productId = req.body.product;
    let result = await getUserCart(req.userId);
    if (!result) {
        return res.status(404).send({ message: 'cart not found' });
    }

    if (!(await productExists(productId))) {
        return sendProductNotFound(res);
    }

    let itemIndex = findCartItemIndex(result, productId);
    if (itemIndex >= 0) {
        result.cartItems[itemIndex].quantity -= 1;
        if (result.cartItems[itemIndex].quantity <= 0) {
            result.cartItems.splice(itemIndex, 1);
        }
    }

    await result.save();
    res.send(result);
});

router.post('/remove', checkLogin, async function (req, res) {
    let productId = req.body.product;
    let result = await getUserCart(req.userId);
    if (!result) {
        return res.status(404).send({ message: 'cart not found' });
    }

    if (!(await productExists(productId))) {
        return sendProductNotFound(res);
    }

    let itemIndex = findCartItemIndex(result, productId);
    if (itemIndex >= 0) {
        result.cartItems.splice(itemIndex, 1);
    }

    await result.save();
    res.send(result);
});


module.exports = router;
