const Ingredient = require('../models/Ingredient');
const MealHistory = require('../models/MealHistory');
const { ensureSameUser } = require('../lib/auth');
const { cleanIngredientName, computePortionPrice, parseIngredientString } = require('../services/ingredientCostService');

async function getIngredientsByDay(req, res) {
  try {
    const { userId, day } = req.params;

    if (!ensureSameUser(req, res, userId)) {
      return undefined;
    }

    const mealHistory = await MealHistory.findOne({ userId, day: day.toLowerCase() });

    if (!mealHistory || !mealHistory.meals || mealHistory.meals.length === 0) {
      return res.status(404).json({ error: 'No meals found for this day' });
    }

    const allIngredients = new Map();

    mealHistory.meals.forEach((meal) => {
      if (meal.ingredients && Array.isArray(meal.ingredients)) {
        meal.ingredients.forEach((ingredientString) => {
          const parsed = parseIngredientString(ingredientString);

          if (!allIngredients.has(parsed.normalized)) {
            allIngredients.set(parsed.normalized, {
              ...parsed,
              mealName: meal.mealName,
              mealType: meal.mealType,
            });
          }
        });
      }
    });

    const ingredientsWithInfo = [];

    for (const [normalized, info] of allIngredients) {
      const cleanedName = cleanIngredientName(info);
      const ingredient = await Ingredient.findOne({
        name: { $regex: cleanedName, $options: 'i' },
      });

      const portionPrice = computePortionPrice(ingredient, info.amount, info.amountUnit);

      ingredientsWithInfo.push({
        name: info.original,
        normalized,
        amount: info.amount,
        amountUnit: info.amountUnit,
        price: portionPrice,
        unit: ingredient ? ingredient.unit : null,
        image_url: ingredient ? ingredient.image_url : null,
        category: ingredient ? ingredient.category : null,
        mealName: info.mealName,
        mealType: info.mealType,
      });
    }

    const totalPrice = ingredientsWithInfo.reduce((sum, ingredient) => sum + (ingredient.price || 0), 0);
    return res.status(200).json({
      day: day.toLowerCase(),
      ingredients: ingredientsWithInfo,
      totalPrice,
    });
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return res.status(500).json({ error: 'Failed to fetch ingredients: ' + error.message });
  }
}

async function upsertIngredient(req, res) {
  try {
    const { name, price, unit, image_url, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Ingredient name is required' });
    }

    const ingredient = await Ingredient.findOneAndUpdate(
      { name: name.toLowerCase() },
      {
        name: name.toLowerCase(),
        price: price || 0,
        unit: unit || 'kg',
        image_url: image_url || null,
        category: category || null,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ message: 'Ingredient saved successfully', ingredient });
  } catch (error) {
    console.error('Error saving ingredient:', error);
    return res.status(500).json({ error: 'Failed to save ingredient: ' + error.message });
  }
}

async function listIngredients(req, res) {
  try {
    const ingredients = await Ingredient.find().sort({ name: 1 });
    return res.status(200).json(ingredients);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return res.status(500).json({ error: 'Failed to fetch ingredients: ' + error.message });
  }
}

async function deleteIngredient(req, res) {
  try {
    const { ingredientId } = req.params;
    const ingredient = await Ingredient.findByIdAndDelete(ingredientId);

    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    return res.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    return res.status(500).json({ error: 'Failed to delete ingredient: ' + error.message });
  }
}

module.exports = {
  deleteIngredient,
  getIngredientsByDay,
  listIngredients,
  upsertIngredient,
};
