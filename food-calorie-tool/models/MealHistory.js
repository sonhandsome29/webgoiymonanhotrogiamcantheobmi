const mongoose = require('mongoose');

const MealHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    day: { 
        type: String, 
        required: true
    },
    meals: [{
        mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
        mealName: { type: String, required: true },
        mealType: { type: String, required: true },
        ingredients: [String],
        calories: Number,
        protein: Number,
        fat: Number,
        carbs: Number,
        image_url: String
    }],
    dateAdded: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MealHistory', MealHistorySchema);


