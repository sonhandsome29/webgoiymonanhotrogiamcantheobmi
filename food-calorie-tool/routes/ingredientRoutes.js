const express = require('express');
const { deleteIngredient, getIngredientsByDay, listIngredients, upsertIngredient } = require('../controllers/ingredientController');
const { requireAdmin } = require('../lib/auth');

const router = express.Router();

router.get('/ingredients/:userId/:day', getIngredientsByDay);
router.post('/ingredients', requireAdmin, upsertIngredient);
router.delete('/ingredients/:ingredientId', requireAdmin, deleteIngredient);
router.get('/ingredients', listIngredients);

module.exports = router;
