const Meal = require('../models/Meal');
const Ingredient = require('../models/Ingredient');
const User = require('../models/User');
const { createIngredientLookupList, getMealIngredientCostDetails } = require('../services/ingredientCostService');
const { buildMealSuggestion } = require('../services/mealSuggestionService');

async function suggestMeals(req, res) {
  try {
    const allMeals = await Meal.find();
    const result = buildMealSuggestion({
      allMeals,
      ...req.body,
    });

    if (req.authUser?.userId) {
      await User.findByIdAndUpdate(req.authUser.userId, {
        latestPlannerProfile: {
          weight: Number(req.body.weight) || null,
          height: Number(req.body.height) || null,
          age: Number(req.body.age) || null,
          gender: req.body.gender || null,
          activity_level: req.body.activity_level || null,
          goal: result.goal,
          bmi: Number.parseFloat(result.bmi),
          targetCaloriesPerDay: result.targetCaloriesPerDay,
          updatedAt: new Date(),
        },
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Suggest meals error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}

async function getMeals(req, res) {
  try {
    const allMeals = await Meal.find().sort({ name: 1 });
    return res.status(200).json(allMeals);
  } catch (error) {
    console.error('Error fetching meals:', error);
    return res.status(500).json({ error: 'Failed to fetch meals list' });
  }
}

async function createMeal(req, res) {
  try {
    const { name, calories, protein, fat, carbs, group, ingredients, instructions, image_url } = req.body;

    if (!name || !group) {
      return res.status(400).json({ error: 'Meal name and group are required' });
    }

    const meal = await Meal.create({
      name: String(name).trim(),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      fat: Number(fat) || 0,
      carbs: Number(carbs) || 0,
      group: String(group).trim(),
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      instructions: instructions || '',
      image_url: image_url || '',
    });

    return res.status(201).json({ message: 'Meal created successfully', meal });
  } catch (error) {
    console.error('Create meal error:', error);
    return res.status(500).json({ error: 'Failed to create meal: ' + error.message });
  }
}

async function updateMeal(req, res) {
  try {
    const { mealId } = req.params;
    const { name, calories, protein, fat, carbs, group, ingredients, instructions, image_url } = req.body;

    const meal = await Meal.findByIdAndUpdate(
      mealId,
      {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(calories !== undefined ? { calories: Number(calories) || 0 } : {}),
        ...(protein !== undefined ? { protein: Number(protein) || 0 } : {}),
        ...(fat !== undefined ? { fat: Number(fat) || 0 } : {}),
        ...(carbs !== undefined ? { carbs: Number(carbs) || 0 } : {}),
        ...(group !== undefined ? { group: String(group).trim() } : {}),
        ...(ingredients !== undefined ? { ingredients: Array.isArray(ingredients) ? ingredients : [] } : {}),
        ...(instructions !== undefined ? { instructions } : {}),
        ...(image_url !== undefined ? { image_url } : {}),
      },
      { new: true }
    );

    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    return res.json({ message: 'Meal updated successfully', meal });
  } catch (error) {
    console.error('Update meal error:', error);
    return res.status(500).json({ error: 'Failed to update meal: ' + error.message });
  }
}

async function deleteMeal(req, res) {
  try {
    const { mealId } = req.params;
    const meal = await Meal.findByIdAndDelete(mealId);

    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    return res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Delete meal error:', error);
    return res.status(500).json({ error: 'Failed to delete meal: ' + error.message });
  }
}

async function getMealIngredientCosts(req, res) {
  try {
    const { mealId } = req.params;
    const meal = await Meal.findById(mealId).lean();

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    const ingredients = await Ingredient.find().lean();
    const ingredientList = createIngredientLookupList(ingredients);
    const { totalCost, details } = getMealIngredientCostDetails(meal, ingredientList);

    return res.json({
      mealId: meal._id,
      name: meal.name,
      calories: meal.calories || 0,
      group: meal.group,
      totalCostPerPerson: totalCost,
      ingredients: details,
    });
  } catch (error) {
    console.error('Error /meals/:mealId/ingredient-costs:', error);
    return res.status(500).json({ message: 'Failed to load ingredient cost details.' });
  }
}

module.exports = {
  createMeal,
  deleteMeal,
  getMealIngredientCosts,
  getMeals,
  suggestMeals,
  updateMeal,
};
