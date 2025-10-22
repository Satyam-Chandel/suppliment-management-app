const HttpError = require('../models/http-error');
const Order = require('../models/order');
const Product = require('../models/product');
const SalesData = require('../models/salesdata');
const mongoose = require('mongoose');
const moment = require('moment');

// GET /api/orders - Get all orders with filters
exports.getOrders = async (req, res, next) => {
    const { status, soldBy, dateFrom, dateTo, sortBy, sortOrder } = req.query;
    
    let filter = {};
    
    // Apply filters
    if (status) {
        filter.status = status;
    }
    
    if (soldBy) {
        filter.soldBy = soldBy;
    }
    
    if (dateFrom || dateTo) {
        filter.orderDate = {};
        if (dateFrom) {
            filter.orderDate.$gte = new Date(dateFrom);
        }
        if (dateTo) {
            filter.orderDate.$lte = new Date(dateTo);
        }
    }
    
    // Sorting
    let sort = {};
    if (sortBy) {
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
        sort = { orderDate: -1 }; // Default sort by newest
    }
    
    let orders;
    try {
        orders = await Order.find(filter).sort(sort);
    } catch (err) {
        const error = new HttpError('Fetching orders failed, please try again.', 500);
        return next(error);
    }
    
    res.json({ orders: orders.map(o => o.toObject({ getters: true })) });
};

// POST /api/orders - Create new order
exports.createOrder = async (req, res, next) => {
    console.log('=== CREATE ORDER REQUEST ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const { customerName, customerPhone, customerEmail, products, discountAmount, soldBy, notes, orderDate } = req.body;
    
    // Validate products and calculate total
    let totalAmount = 0;
    let validatedProducts = [];
    
    try {
        for (let item of products) {
            const product = await Product.findById(item.productId);
            
            if (!product) {
                const error = new HttpError(`Product with id ${item.productId} not found.`, 404);
                return next(error);
            }
            
            // If unitId is provided, validate and mark unit as sold
            if (item.unitId) {
                const unit = product.units.id(item.unitId);
                if (!unit) {
                    const error = new HttpError(`Unit with id ${item.unitId} not found.`, 404);
                    return next(error);
                }
                
                if (unit.status !== 'available') {
                    const error = new HttpError(`Unit ${unit.serialNumber} is not available (status: ${unit.status}).`, 400);
                    return next(error);
                }
                
                validatedProducts.push({
                    productId: product._id,
                    productName: product.name,
                    unitId: item.unitId,
                    serialNumber: unit.serialNumber,
                    quantity: 1, // Each unit is quantity 1
                    price: product.price
                });
                
                totalAmount += product.price;
            } else {
                // Legacy support for quantity-based orders
                if (product.quantity < item.quantity) {
                    const error = new HttpError(`Insufficient stock for ${product.name}. Available: ${product.quantity}`, 400);
                    return next(error);
                }
                
                validatedProducts.push({
                    productId: product._id,
                    productName: product.name,
                    quantity: item.quantity,
                    price: product.price
                });
                
                totalAmount += product.price * item.quantity;
            }
        }
    } catch (err) {
        console.error('Error validating products:', err);
        const error = new HttpError('Validating products failed, please try again.', 500);
        return next(error);
    }
    
    const finalAmount = totalAmount - (discountAmount || 0);
    
    const createdOrder = new Order({
        customerName,
        customerPhone,
        customerEmail,
        products: validatedProducts,
        totalAmount,
        discountAmount: discountAmount || 0,
        finalAmount,
        status: 'pending',
        orderDate: orderDate || new Date(),
        soldBy,
        notes
    });
    
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        
        // Save order
        await createdOrder.save({ session: sess });
        
        // Update product quantities and mark units as sold
        for (let item of validatedProducts) {
            const product = await Product.findById(item.productId);
            
            if (item.unitId) {
                // Mark specific unit as sold
                const unit = product.units.id(item.unitId);
                unit.status = 'sold';
                unit.soldDate = new Date();
                unit.orderId = createdOrder._id;
                
                // Decrease product quantity
                product.quantity -= 1;
            } else {
                // Legacy: decrease quantity
                product.quantity -= item.quantity;
            }
            
            await product.save({ session: sess });
        }
        
        // Update sales data
        const monthYear = moment(createdOrder.orderDate).format('YYYY-MM');
        const year = moment(createdOrder.orderDate).year();
        
        for (let item of validatedProducts) {
            let salesData = await SalesData.findOne({ 
                productId: item.productId, 
                month: monthYear 
            });
            
            const quantity = item.quantity || 1;
            
            if (salesData) {
                salesData.quantitySold += quantity;
                salesData.revenue += item.price * quantity;
                salesData.updatedAt = new Date();
                await salesData.save({ session: sess });
            } else {
                const newSalesData = new SalesData({
                    productId: item.productId,
                    productName: item.productName,
                    quantitySold: quantity,
                    revenue: item.price * quantity,
                    month: monthYear,
                    year: year
                });
                await newSalesData.save({ session: sess });
            }
        }
        
        await sess.commitTransaction();
        console.log('Order created successfully:', createdOrder._id);
    } catch (err) {
        console.error('Error creating order:', err);
        const error = new HttpError('Creating order failed, please try again.', 500);
        return next(error);
    }
    
    res.status(201).json({ order: createdOrder.toObject({ getters: true }) });
};

// PUT /api/orders/:id - Update order (mainly status)
exports.updateOrder = async (req, res, next) => {
    const { status, notes } = req.body;
    const orderId = req.params.id;
    
    let order;
    try {
        order = await Order.findById(orderId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update order.', 500);
        return next(error);
    }
    
    if (!order) {
        const error = new HttpError('Could not find order for this id.', 404);
        return next(error);
    }
    
    if (status) order.status = status;
    if (notes !== undefined) order.notes = notes;
    
    try {
        await order.save();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update order.', 500);
        return next(error);
    }
    
    res.status(200).json({ order: order.toObject({ getters: true }) });
};

// GET /api/orders/:id - Get single order
exports.getOrderById = async (req, res, next) => {
    const orderId = req.params.id;
    
    let order;
    try {
        order = await Order.findById(orderId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find order.', 500);
        return next(error);
    }
    
    if (!order) {
        const error = new HttpError('Could not find order for this id.', 404);
        return next(error);
    }
    
    res.json({ order: order.toObject({ getters: true }) });
};

