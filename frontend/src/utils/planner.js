import { parseTagInput, resolveGroupKey } from './formatters'

export function buildDislikesPayload(form) {
  const dislikedGroups = parseTagInput(form.dislikedGroups).map(resolveGroupKey)
  const dislikedIngredients = parseTagInput(form.dislikedIngredients)
  const dislikedMeals = parseTagInput(form.dislikedMeals)

  const payload = {}

  if (dislikedGroups.length) payload.dislikedGroups = dislikedGroups
  if (dislikedIngredients.length) payload.dislikedIngredients = dislikedIngredients
  if (dislikedMeals.length) payload.dislikedMeals = dislikedMeals

  return payload
}

export function flattenPlanMeals(plan) {
  if (!plan?.meals?.length) return []

  const mealTypeMap = {
    'Bua sang': 'breakfast',
    'Bua chieu': 'lunch',
    'Bua toi': 'dinner',
    'Bữa sáng': 'breakfast',
    'Bữa chiều': 'lunch',
    'Bữa tối': 'dinner',
    Breakfast: 'breakfast',
    Lunch: 'lunch',
    Dinner: 'dinner',
  }

  return plan.meals.flatMap((section) =>
    (section.details || []).map((meal) => ({
      mealId: meal._id,
      mealName: meal.name,
      mealType: mealTypeMap[section.meal] || 'breakfast',
      ingredients: meal.ingredients || [],
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      fat: meal.fat || 0,
      carbs: meal.carbs || 0,
      image_url: meal.image_url || null,
    })),
  )
}
