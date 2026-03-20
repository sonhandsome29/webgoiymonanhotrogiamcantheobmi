const mongoose = require('mongoose');

const PlannerProfileSchema = new mongoose.Schema({
    weight: Number,
    height: Number,
    age: Number,
    gender: String,
    activity_level: String,
    goal: String,
    bmi: Number,
    targetCaloriesPerDay: Number,
    updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    password: { type: String, required: true },
    latestPlannerProfile: {
        type: PlannerProfileSchema,
        default: null,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
