const mongoose = require('mongoose');
const MealSchema = new mongoose.Schema({
    name: String,
    calories: Number,
    protein: Number,
    fat: Number,
    carbs: Number,
    group: String,
    ingredients: [String],
    instructions: String,
    image_url: { type: String }

});
module.exports = mongoose.model('Meal', MealSchema);