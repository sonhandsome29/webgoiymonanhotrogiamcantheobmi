const express = require('express');
const { createMeal, deleteMeal, getMealIngredientCosts, getMeals, suggestMeals, updateMeal } = require('../controllers/mealController');
const { requireAdmin, requireAuth } = require('../lib/auth');

const router = express.Router();

router.post('/suggest-meals', requireAuth, suggestMeals);
router.get('/meals', getMeals);
router.get('/meals/:mealId/ingredient-costs', getMealIngredientCosts);
router.post('/admin/meals', requireAdmin, createMeal);
router.put('/admin/meals/:mealId', requireAdmin, updateMeal);
router.delete('/admin/meals/:mealId', requireAdmin, deleteMeal);

module.exports = router;
