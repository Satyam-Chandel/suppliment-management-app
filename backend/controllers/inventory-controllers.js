const HttpError = require('../models/http-error');
const Product = require('../models/product');

// GET /api/inventory/alerts - Get inventory alerts
exports.getInventoryAlerts = async (req, res, next) => {
    const { type, months, threshold } = req.query;
    
    try {
        let result = {};
        
        if (type === 'expiry' || !type) {
            const now = new Date();
            const monthsArray = months ? months.split(',').map(m => parseInt(m)) : [1, 3, 6];
            
            for (let month of monthsArray) {
                const targetDate = new Date();
                targetDate.setMonth(targetDate.getMonth() + month);
                
                // Find products with units expiring within the time frame
                const products = await Product.find({
                    'units.expiryDate': { $lte: targetDate, $gt: now },
                    'units.status': 'available'
                });
                
                // Filter and transform products to show individual units
                const unitsExpiring = [];
                for (const product of products) {
                    const expiringUnits = product.units.filter(unit => {
                        const unitExpiry = new Date(unit.expiryDate);
                        return unitExpiry <= targetDate && unitExpiry > now && unit.status === 'available';
                    });
                    
                    if (expiringUnits.length > 0) {
                        // Create a product entry for each expiring unit
                        for (const unit of expiringUnits) {
                            unitsExpiring.push({
                                ...product.toObject({ getters: true }),
                                expiryDate: unit.expiryDate,
                                serialNumber: unit.serialNumber,
                                unitId: unit._id,
                                quantity: 1 // Each unit is 1 quantity
                            });
                        }
                    }
                }
                
                // Sort by expiry date
                unitsExpiring.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
                result[`${month}Month`] = unitsExpiring;
            }
        }
        
        if (type === 'lowStock' || !type) {
            const stockThreshold = threshold ? parseInt(threshold) : 10;
            const lowStockProducts = await Product.find({
                quantity: { $lte: stockThreshold }
            }).sort({ quantity: 1 });
            
            result.lowStock = lowStockProducts.map(p => p.toObject({ getters: true }));
        }
        
        res.json(result);
    } catch (err) {
        console.error('Error fetching inventory alerts:', err);
        const error = new HttpError('Fetching inventory alerts failed, please try again.', 500);
        return next(error);
    }
};

// PUT /api/inventory/:id/quantity - Update product quantity
exports.updateProductQuantity = async (req, res, next) => {
    const { quantity } = req.body;
    const productId = req.params.id;
    
    if (quantity === undefined || quantity < 0) {
        const error = new HttpError('Invalid quantity value.', 400);
        return next(error);
    }
    
    let product;
    try {
        product = await Product.findById(productId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update quantity.', 500);
        return next(error);
    }
    
    if (!product) {
        const error = new HttpError('Could not find product for this id.', 404);
        return next(error);
    }
    
    product.quantity = quantity;
    
    try {
        await product.save();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update quantity.', 500);
        return next(error);
    }
    
    res.status(200).json({ product: product.toObject({ getters: true }) });
};

