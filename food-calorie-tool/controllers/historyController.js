const MealHistory = require('../models/MealHistory');
const { ensureSameUser } = require('../lib/auth');

async function saveMealHistory(req, res) {
  try {
    const { userId, day, meals } = req.body;

    if (!userId || !day || !meals || !Array.isArray(meals)) {
      return res.status(400).json({ error: 'userId, day, and meals array are required' });
    }

    if (!ensureSameUser(req, res, userId)) {
      return undefined;
    }

    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!validDays.includes(day.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid day. Must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday' });
    }

    const mealsWithIngredients = meals.map((meal) => ({
      mealId: meal.mealId,
      mealName: meal.mealName,
      mealType: meal.mealType,
      ingredients: meal.ingredients || [],
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      fat: meal.fat || 0,
      carbs: meal.carbs || 0,
      image_url: meal.image_url || null,
    }));

    let mealHistory = await MealHistory.findOne({ userId, day: day.toLowerCase() });

    if (mealHistory) {
      mealHistory.meals = mealsWithIngredients;
      mealHistory.dateAdded = new Date();
    } else {
      mealHistory = new MealHistory({
        userId,
        day: day.toLowerCase(),
        meals: mealsWithIngredients,
      });
    }

    await mealHistory.save();
    return res.status(200).json({ message: 'Meal history saved successfully', mealHistory });
  } catch (error) {
    console.error('Error saving meal history:', error);
    return res.status(500).json({ error: 'Failed to save meal history: ' + error.message });
  }
}

async function getMealHistoryByDay(req, res) {
  try {
    const { userId, day } = req.params;

    if (!ensureSameUser(req, res, userId)) {
      return undefined;
    }

    const mealHistory = await MealHistory.findOne({ userId, day: day.toLowerCase() }).populate('meals.mealId');

    if (!mealHistory) {
      return res.status(404).json({ error: 'No meal history found for this day' });
    }

    return res.status(200).json(mealHistory);
  } catch (error) {
    console.error('Error fetching meal history:', error);
    return res.status(500).json({ error: 'Failed to fetch meal history: ' + error.message });
  }
}

async function getMealHistoryByUser(req, res) {
  try {
    const { userId } = req.params;

    if (!ensureSameUser(req, res, userId)) {
      return undefined;
    }

    const mealHistories = await MealHistory.find({ userId }).populate('meals.mealId').sort({ day: 1 });
    return res.status(200).json(mealHistories);
  } catch (error) {
    console.error('Error fetching meal histories:', error);
    return res.status(500).json({ error: 'Failed to fetch meal histories: ' + error.message });
  }
}

module.exports = {
  getMealHistoryByDay,
  getMealHistoryByUser,
  saveMealHistory,
};
