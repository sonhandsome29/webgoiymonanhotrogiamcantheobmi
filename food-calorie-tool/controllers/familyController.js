const FamilyMenuResult = require('../models/FamilyMenuResult');
const Ingredient = require('../models/Ingredient');
const Meal = require('../models/Meal');
const { buildFamilyMenu, calculateFamilyMinCost } = require('../services/familyMenuService');

async function getFamilyMinCost(req, res) {
  try {
    const meals = await Meal.find().lean();
    const ingredients = await Ingredient.find().lean();
    const result = await calculateFamilyMinCost(meals, ingredients);

    return res.json(result);
  } catch (error) {
    console.error('Error /family/min-cost:', error);
    return res.status(error.status || 500).json({
      message: error.message || 'Failed to calculate the minimum family budget.',
      ...(error.minBudget ? { minBudget: error.minBudget } : {}),
    });
  }
}

async function generateFamilyMenu(req, res) {
  try {
    const meals = await Meal.find().lean();
    const ingredients = await Ingredient.find().lean();
    const payload = await buildFamilyMenu({
      meals,
      ingredients,
      familySize: Number.parseInt(req.body.familySize, 10),
      weeklyBudget: Number.parseInt(req.body.weeklyBudget, 10),
    });
    let saved = null;

    if (req.authUser?.userId) {
      saved = await FamilyMenuResult.create({
        userId: req.authUser.userId,
        familySize: payload.familySize,
        weeklyBudget: Number.parseInt(req.body.weeklyBudget, 10),
        minBudgetPerPerson: payload.minBudgetPerPerson,
        minBudgetForFamily: payload.minBudgetForFamily,
        isBudgetEnough: true,
        baseWeekCost: payload.baseWeekCost,
        buffer: payload.buffer,
        totalWeekCost: payload.totalWeekCost,
        days: payload.days,
      });
    }

    return res.json({
      ...payload,
      savedId: saved?._id || null,
    });
  } catch (error) {
    console.error('Error /family/menu:', error);
    return res.status(error.status || 500).json({
      message: error.message || 'Failed to generate the family menu.',
      ...(error.minBudget ? { minBudget: error.minBudget } : {}),
    });
  }
}

module.exports = {
  generateFamilyMenu,
  getFamilyMinCost,
};
