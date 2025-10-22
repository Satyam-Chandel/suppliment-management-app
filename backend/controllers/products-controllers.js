const HttpError = require('../models/http-error');
const Product = require('../models/product');
const mongoose = require('mongoose');

// GET /api/products - Get all products with filters
exports.getProducts = async (req, res, next) => {
    const { category, brand, search, lowStock, nearExpiry, sortBy, sortOrder } = req.query;
    
    let filter = {};
    
    // Apply filters
    if (category) {
        filter.type = category;
    }
    
    if (brand) {
        filter.brand = brand;
    }
    
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } },
            { flavor: { $regex: search, $options: 'i' } }
        ];
    }
    
    if (lowStock) {
        const threshold = parseInt(lowStock) || 10;
        filter.quantity = { $lte: threshold };
    }
    
    if (nearExpiry) {
        const months = parseInt(nearExpiry);
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + months);
        filter.expiryDate = { $lte: targetDate, $gt: new Date() };
    }
    
    // Sorting
    let sort = {};
    if (sortBy) {
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
        sort = { dateAdded: -1 }; // Default sort by newest
    }
    
    let products;
    try {
        products = await Product.find(filter).sort(sort);
    } catch (err) {
        const error = new HttpError('Fetching products failed, please try again.', 500);
        return next(error);
    }
    
    res.json({ products: products.map(p => p.toObject({ getters: true })) });
};

// POST /api/products - Create new product
exports.createProduct = async (req, res, next) => {
    console.log('=== CREATE PRODUCT REQUEST ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const { name, brand, type, flavor, weight, price, costPrice, quantity, units, description } = req.body;
    
    // Validate required fields
    if (!name || !brand || !type || !flavor || !weight || !price || !costPrice || !quantity) {
        const error = new HttpError('Missing required fields', 422);
        return next(error);
    }
    
    const createdProduct = new Product({
        name,
        brand,
        type,
        flavor,
        weight,
        price: parseFloat(price),
        costPrice: parseFloat(costPrice),
        quantity: parseInt(quantity),
        units: [], // Will be populated below
        description,
        image: req.file ? req.file.path : null,
        dateAdded: new Date()
    });
    
    // Add units with provided serial numbers
    if (units && Array.isArray(units)) {
        // Check for duplicate serial numbers in the request
        const serialNumbers = units.map(u => u.serialNumber?.trim()).filter(Boolean);
        const duplicates = serialNumbers.filter((item, index) => serialNumbers.indexOf(item) !== index);
        if (duplicates.length > 0) {
            const error = new HttpError(`Duplicate serial numbers found: ${duplicates.join(', ')}`, 422);
            return next(error);
        }
        
        // Check if serial numbers already exist in database
        for (const unit of units) {
            const serialNumber = unit.serialNumber || createdProduct.generateSerialNumber();
            const trimmedSerial = serialNumber.trim();
            
            // Check if this serial number already exists
            const existingProduct = await Product.findOne({ 'units.serialNumber': trimmedSerial });
            if (existingProduct) {
                const error = new HttpError(`Serial number "${trimmedSerial}" already exists in the system`, 422);
                return next(error);
            }
            
            createdProduct.units.push({
                serialNumber: trimmedSerial,
                expiryDate: unit.expiryDate,
                status: 'available'
            });
        }
    }
    
    try {
        await createdProduct.save();
        console.log('Product created successfully:', createdProduct._id);
    } catch (err) {
        console.error('Error creating product:', err);
        console.error('Error details:', err.message);
        console.error('Error stack:', err.stack);
        const error = new HttpError(`Creating product failed: ${err.message}`, 500);
        return next(error);
    }
    
    res.status(201).json({ product: createdProduct.toObject({ getters: true }) });
};

// PUT /api/products/:id - Update product
exports.updateProduct = async (req, res, next) => {
    const { name, brand, type, flavor, weight, price, costPrice, quantity, expiryDate, description } = req.body;
    const productId = req.params.id;
    
    let product;
    try {
        product = await Product.findById(productId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update product.', 500);
        return next(error);
    }
    
    if (!product) {
        const error = new HttpError('Could not find product for this id.', 404);
        return next(error);
    }
    
    // Update fields
    if (name) product.name = name;
    if (brand) product.brand = brand;
    if (type) product.type = type;
    if (flavor) product.flavor = flavor;
    if (weight) product.weight = weight;
    if (price !== undefined) product.price = price;
    if (costPrice !== undefined) product.costPrice = costPrice;
    if (quantity !== undefined) product.quantity = quantity;
    if (expiryDate) product.expiryDate = expiryDate;
    if (description) product.description = description;
    if (req.file) product.image = req.file.path;
    
    try {
        await product.save();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update product.', 500);
        return next(error);
    }
    
    res.status(200).json({ product: product.toObject({ getters: true }) });
};

// DELETE /api/products/:id - Delete product
exports.deleteProduct = async (req, res, next) => {
    const productId = req.params.id;
    
    let product;
    try {
        product = await Product.findById(productId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not delete product.', 500);
        return next(error);
    }
    
    if (!product) {
        const error = new HttpError('Could not find product for this id.', 404);
        return next(error);
    }
    
    try {
        await product.remove();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not delete product.', 500);
        return next(error);
    }
    
    res.status(200).json({ message: 'Product deleted successfully.' });
};

// GET /api/products/:id - Get single product
exports.getProductById = async (req, res, next) => {
    const productId = req.params.id;
    
    let product;
    try {
        product = await Product.findById(productId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find product.', 500);
        return next(error);
    }
    
    if (!product) {
        const error = new HttpError('Could not find product for this id.', 404);
        return next(error);
    }
    
    res.json({ product: product.toObject({ getters: true }) });
};

// DELETE /api/products/:productId/units/:unitId - Delete a specific unit from a product
exports.deleteUnit = async (req, res, next) => {
    const { productId, unitId } = req.params;
    
    let product;
    try {
        product = await Product.findById(productId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find product.', 500);
        return next(error);
    }
    
    if (!product) {
        const error = new HttpError('Could not find product for this id.', 404);
        return next(error);
    }
    
    // Find the unit
    const unitIndex = product.units.findIndex(unit => unit._id.toString() === unitId);
    
    if (unitIndex === -1) {
        const error = new HttpError('Could not find unit for this id.', 404);
        return next(error);
    }
    
    // Remove the unit from the array
    product.units.splice(unitIndex, 1);
    
    // Update the quantity
    product.quantity = product.units.filter(u => u.status === 'available').length;
    
    try {
        await product.save();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not delete unit.', 500);
        return next(error);
    }
    
    res.status(200).json({ 
        message: 'Unit deleted successfully.',
        product: product.toObject({ getters: true })
    });
};

