const express = require('express');
const { check } = require('express-validator');

const ordersControllers = require('../controllers/orders-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

// All routes are public (auth handled by Gym app)
router.get('/', ordersControllers.getOrders);
router.get('/:id', ordersControllers.getOrderById);

router.post('/',
    [
        check('customerName').not().isEmpty(),
        check('customerPhone').not().isEmpty(),
        check('soldBy').not().isEmpty(),
        check('products').isArray({ min: 1 })
    ],
    ordersControllers.createOrder
);

router.put('/:id', ordersControllers.updateOrder);

module.exports = router;

