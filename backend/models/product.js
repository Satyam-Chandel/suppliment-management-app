const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Sub-schema for individual product units
const productUnitSchema = new Schema({
    serialNumber: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    status: { 
        type: String, 
        enum: ['available', 'sold', 'expired', 'damaged'],
        default: 'available'
    },
    soldDate: { type: Date },
    orderId: { type: mongoose.Types.ObjectId, ref: 'Order' }
}, { _id: true });

const productSchema = new Schema({
    name: { type: String, required: true },
    brand: { type: String, required: true },
    type: { 
        type: String, 
        required: true,
        enum: ['whey-protein', 'creatine', 'peanut-butter', 'pre-workout', 'other']
    },
    flavor: { type: String, required: true },
    weight: { type: String, required: true },
    price: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 0 }, // Total available units
    units: [productUnitSchema], // Individual product units with serial numbers
    dateAdded: { type: Date, default: Date.now },
    image: { type: String, required: false },
    description: { type: String, required: false }
});

// Virtual to get available quantity
productSchema.virtual('availableQuantity').get(function() {
    return this.units.filter(unit => unit.status === 'available').length;
});

// Method to generate serial number
productSchema.methods.generateSerialNumber = function() {
    const prefix = this.type.substring(0, 3).toUpperCase();
    const brandPrefix = this.brand.substring(0, 2).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${brandPrefix}-${timestamp}${random}`;
};

// Indexes for better query performance
productSchema.index({ type: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ 'units.expiryDate': 1 });
productSchema.index({ 'units.serialNumber': 1 });
productSchema.index({ 'units.status': 1 });
productSchema.index({ quantity: 1 });

module.exports = mongoose.model('Product', productSchema);

