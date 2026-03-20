import { createLocalMeal, createOrUpdateLocalIngredient, deleteLocalIngredient, deleteLocalMeal, getLocalIngredients, getLocalMeals, updateLocalMeal } from './catalogData'
import { calculateFamilyMinCostLocal } from '../utils/familyMenuEngine'

export function resolveImageUrl(imagePath) {
  if (!imagePath) return ''
  if (/^https?:\/\//i.test(imagePath)) return imagePath

  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`
}

export const api = {
  async getMeals() {
    return getLocalMeals().slice().sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
  },

  async getIngredients() {
    return getLocalIngredients().slice().sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
  },

  async getFamilyMinCost() {
    return calculateFamilyMinCostLocal(getLocalMeals(), getLocalIngredients())
  },

  async createMeal(payload) {
    return { meal: createLocalMeal(payload), message: 'Meal created successfully' }
  },

  async updateMeal(mealId, payload) {
    const meal = updateLocalMeal(mealId, payload)

    if (!meal) {
      const error = new Error('Meal not found')
      error.status = 404
      throw error
    }

    return { meal, message: 'Meal updated successfully' }
  },

  async deleteMeal(mealId) {
    deleteLocalMeal(mealId)
    return { message: 'Meal deleted successfully' }
  },

  async upsertIngredient(payload) {
    return createOrUpdateLocalIngredient(payload)
  },

  async deleteIngredient(ingredientId) {
    deleteLocalIngredient(ingredientId)
    return { message: 'Ingredient deleted successfully' }
  },
}
