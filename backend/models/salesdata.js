const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const salesDataSchema = new Schema({
    productId: { type: mongoose.Types.ObjectId, required: true, ref: 'Product' },
    productName: { type: String, required: true },
    quantitySold: { type: Number, required: true, default: 0 },
    revenue: { type: Number, required: true, default: 0 },
    month: { type: String, required: true }, // Format: "YYYY-MM"
    year: { type: Number, required: true },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes for analytics queries
salesDataSchema.index({ month: 1 });
salesDataSchema.index({ productId: 1, month: 1 }, { unique: true });
salesDataSchema.index({ year: 1 });

module.exports = mongoose.model('SalesData', salesDataSchema);

