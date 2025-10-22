const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: { type: String, required: true },
    type: { 
        type: String, 
        required: true,
        unique: true,
        enum: ['whey-protein', 'creatine', 'peanut-butter', 'pre-workout', 'other']
    },
    description: { type: String, required: false },
    image: { type: String, required: false }
});

module.exports = mongoose.model('Category', categorySchema);

