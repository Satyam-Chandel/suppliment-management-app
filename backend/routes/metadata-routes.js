const express = require('express');
const { check } = require('express-validator');

const metadataControllers = require('../controllers/metadata-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

// All routes are public (auth handled by Gym app)
router.get('/categories', metadataControllers.getCategories);
router.get('/brands', metadataControllers.getBrands);

router.post('/categories',
    [
        check('name').not().isEmpty(),
        check('type').not().isEmpty()
    ],
    metadataControllers.createCategory
);

router.post('/brands',
    [
        check('name').not().isEmpty()
    ],
    metadataControllers.createBrand
);

module.exports = router;

