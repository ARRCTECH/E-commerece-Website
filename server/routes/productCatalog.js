const express = require('express');
const router = express.Router();
const {
    getCatalogProducts,
    getCatalogCollections,
    getCatalogProductsByCollection
} = require('../controllers/productCatalogController');


router.get('/products', getCatalogProducts);

router.get('/collections', getCatalogCollections);

router.get('/products-by-collection', getCatalogProductsByCollection);

module.exports = router;