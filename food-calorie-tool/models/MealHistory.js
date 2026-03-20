const mongoose = require('mongoose');

const MealHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    day: { 
        type: String, 
        required: true,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    meals: [{
        mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
        mealName: { type: String, required: true },
        mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
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


