const HttpError = require('../models/http-error');
const SalesData = require('../models/salesdata');
const Product = require('../models/product');
const Order = require('../models/order');
const moment = require('moment');

// GET /api/analytics/sales - Get sales data with filters
exports.getSalesData = async (req, res, next) => {
    const { period, value, groupBy, includeRevenue } = req.query;
    
    let filter = {};
    
    if (period === 'month' && value) {
        filter.month = value; // Format: YYYY-MM
    } else if (period === 'year' && value) {
        filter.year = parseInt(value);
    }
    
    let salesData;
    try {
        salesData = await SalesData.find(filter).sort({ quantitySold: -1 });
    } catch (err) {
        const error = new HttpError('Fetching sales data failed, please try again.', 500);
        return next(error);
    }
    
    res.json({ salesData: salesData.map(s => s.toObject({ getters: true })) });
};

// GET /api/analytics/dashboard - Get dashboard summary
exports.getDashboardStats = async (req, res, next) => {
    try {
        // Total products
        const totalProducts = await Product.countDocuments();
        
        // Low stock products (quantity <= 10)
        const lowStockCount = await Product.countDocuments({ quantity: { $lte: 10 } });
        
        // Near expiry products (expiring in next 3 months)
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        const nearExpiryCount = await Product.countDocuments({ 
            expiryDate: { $lte: threeMonthsFromNow, $gt: new Date() }
        });
        
        // Current month sales
        const currentMonth = moment().format('YYYY-MM');
        const currentMonthSales = await SalesData.find({ month: currentMonth });
        
        const monthRevenue = currentMonthSales.reduce((sum, item) => sum + item.revenue, 0);
        const monthQuantity = currentMonthSales.reduce((sum, item) => sum + item.quantitySold, 0);
        
        // Top selling products (current month)
        const topProducts = await SalesData.find({ month: currentMonth })
            .sort({ quantitySold: -1 })
            .limit(5);
        
        // Recent orders
        const recentOrders = await Order.find()
            .sort({ orderDate: -1 })
            .limit(5);
        
        // Pending orders count
        const pendingOrdersCount = await Order.countDocuments({ status: 'pending' });
        
        res.json({
            totalProducts,
            lowStockCount,
            nearExpiryCount,
            monthRevenue,
            monthQuantity,
            topProducts: topProducts.map(p => p.toObject({ getters: true })),
            recentOrders: recentOrders.map(o => o.toObject({ getters: true })),
            pendingOrdersCount
        });
    } catch (err) {
        const error = new HttpError('Fetching dashboard stats failed, please try again.', 500);
        return next(error);
    }
};

