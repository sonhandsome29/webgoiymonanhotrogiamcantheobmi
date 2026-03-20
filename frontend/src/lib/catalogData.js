import seedMeals from '../data/seedMeals.json'
import seedIngredients from '../data/seedIngredients.json'

const STORAGE_KEYS = {
  meals: 'sone_local_catalog_meals',
  ingredients: 'sone_local_catalog_ingredients',
}

function readJson(key, fallback) {
  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? JSON.parse(rawValue) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function createId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getLocalMeals() {
  return readJson(STORAGE_KEYS.meals, seedMeals)
}

export function saveLocalMeals(meals) {
  writeJson(STORAGE_KEYS.meals, meals)
}

export function createLocalMeal(payload) {
  const meals = getLocalMeals()
  const meal = { _id: createId('meal'), ...payload }
  saveLocalMeals([meal, ...meals])
  return meal
}

export function updateLocalMeal(mealId, payload) {
  const meals = getLocalMeals()
  const nextMeals = meals.map((meal) => (meal._id === mealId ? { ...meal, ...payload } : meal))
  saveLocalMeals(nextMeals)
  return nextMeals.find((meal) => meal._id === mealId) || null
}

export function deleteLocalMeal(mealId) {
  saveLocalMeals(getLocalMeals().filter((meal) => meal._id !== mealId))
}

export function getLocalIngredients() {
  return readJson(STORAGE_KEYS.ingredients, seedIngredients)
}

export function saveLocalIngredients(ingredients) {
  writeJson(STORAGE_KEYS.ingredients, ingredients)
}

export function createOrUpdateLocalIngredient(payload) {
  const ingredients = getLocalIngredients()
  const normalizedName = String(payload.name || '').trim().toLowerCase()
  const existing = ingredients.find((ingredient) => String(ingredient.name || '').trim().toLowerCase() === normalizedName)

  if (existing) {
    const nextIngredients = ingredients.map((ingredient) =>
      ingredient._id === existing._id ? { ...ingredient, ...payload } : ingredient,
    )
    saveLocalIngredients(nextIngredients)
    return nextIngredients.find((ingredient) => ingredient._id === existing._id)
  }

  const nextIngredient = { _id: createId('ingredient'), ...payload }
  saveLocalIngredients([nextIngredient, ...ingredients])
  return nextIngredient
}

export function deleteLocalIngredient(ingredientId) {
  saveLocalIngredients(getLocalIngredients().filter((ingredient) => ingredient._id !== ingredientId))
}
