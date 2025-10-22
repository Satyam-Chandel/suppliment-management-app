const express = require('express');

const inventoryControllers = require('../controllers/inventory-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

// All routes are public (auth handled by Gym app)
router.get('/alerts', inventoryControllers.getInventoryAlerts);
router.put('/:id/quantity', inventoryControllers.updateProductQuantity);

module.exports = router;

