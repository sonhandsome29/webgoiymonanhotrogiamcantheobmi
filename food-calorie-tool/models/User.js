const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user', enum: ['user', 'admin'] },
    latestPlannerProfile: {
        weight: { type: String, default: '' },
        height: { type: String, default: '' },
        age: { type: String, default: '' },
        gender: { type: String, default: '' },
        activity_level: { type: String, default: '' },
        dislikedGroups: { type: String, default: '' },
        dislikedIngredients: { type: String, default: '' },
        dislikedMeals: { type: String, default: '' },
    }
});

module.exports = mongoose.model('User', userSchema);