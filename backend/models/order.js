const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
    productId: { type: mongoose.Types.ObjectId, required: true, ref: 'Product' },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
}, { _id: false });

const orderSchema = new Schema({
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String, required: false },
    products: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    status: { 
        type: String, 
        required: true,
        enum: ['pending', 'fulfilled'],
        default: 'pending'
    },
    orderDate: { type: Date, default: Date.now },
    soldBy: { type: String, required: true },
    notes: { type: String, required: false }
});

// Indexes for filtering and sorting
orderSchema.index({ status: 1 });
orderSchema.index({ soldBy: 1 });
orderSchema.index({ orderDate: -1 });

module.exports = mongoose.model('Order', orderSchema);

