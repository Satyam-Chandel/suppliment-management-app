const express = require('express');
const { check } = require('express-validator');

const productsControllers = require('../controllers/products-controllers');
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

// All routes are public (auth handled by Gym app)
router.get('/', productsControllers.getProducts);
router.get('/:id', productsControllers.getProductById);

router.post('/', 
    fileUpload.single('image'),
    [
        check('name').not().isEmpty(),
        check('brand').not().isEmpty(),
        check('type').not().isEmpty(),
        check('price').isNumeric(),
        check('costPrice').isNumeric(),
        check('quantity').isNumeric()
    ],
    productsControllers.createProduct
);

router.put('/:id', 
    fileUpload.single('image'),
    productsControllers.updateProduct
);

// Delete a specific unit from a product (must come before DELETE /:id)
router.delete('/:productId/units/:unitId', productsControllers.deleteUnit);

router.delete('/:id', productsControllers.deleteProduct);

module.exports = router;

