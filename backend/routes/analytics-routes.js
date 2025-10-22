const express = require('express');

const analyticsControllers = require('../controllers/analytics-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

// All routes are public (auth handled by Gym app)
router.get('/sales', analyticsControllers.getSalesData);
router.get('/dashboard', analyticsControllers.getDashboardStats);

module.exports = router;

