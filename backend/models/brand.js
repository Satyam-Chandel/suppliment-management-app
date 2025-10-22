const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const brandSchema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: false },
    logo: { type: String, required: false },
    image: { type: String, required: false }
});

module.exports = mongoose.model('Brand', brandSchema);

