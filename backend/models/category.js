const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: { type: String, required: true },
    type: { 
        type: String, 
        required: true,
        unique: true
        // Removed enum restriction to allow custom categories
    },
    description: { type: String, required: false },
    image: { type: String, required: false }
});

module.exports = mongoose.model('Category', categorySchema);

