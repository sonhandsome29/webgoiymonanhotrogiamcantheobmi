// models/Ingredient.js
const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    price: {
        type: Number,
        default: 0
    },
    unit: {
        type: String,
        default: 'kg'
    },
    image_url: {
        type: String,
        default: null
    },
    category: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Ingredient', IngredientSchema);