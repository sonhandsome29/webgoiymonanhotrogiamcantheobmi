function createHttpError(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
}

function pickUniqueMeals(pool, count, usedIds) {
  const available = pool.filter((meal) => !usedIds.has(String(meal._id || meal.name)))
  const selected = []

  while (available.length && selected.length < count) {
    const index = Math.floor(Math.random() * available.length)
    const [meal] = available.splice(index, 1)
    selected.push(meal)
    usedIds.add(String(meal._id || meal.name))
  }

  return selected
}

function normalizeIngredients(items = []) {
  return items.map((item) => String(item || '').toLowerCase())
}

export function buildMealSuggestionLocal({ allMeals, weight, height, age, gender, activity_level, dislikes = {}, overrideTargetCalories }) {
  if (!weight || !height) {
    throw createHttpError('Weight and height are required.')
  }

  let targetCaloriesPerDay
  let goal = 'maintain'

  const heightInMeters = height / 100
  const bmi = weight / (heightInMeters * heightInMeters)

  if (bmi >= 25) goal = 'lose'
  else if (bmi < 18.5) goal = 'gain'

  if (overrideTargetCalories) {
    targetCaloriesPerDay = overrideTargetCalories
  } else {
    const userAge = age || 30
    const genderConstant = gender === 'female' ? -161 : 5
    const bmr = 10 * weight + 6.25 * height - 5 * userAge + genderConstant
    const activityFactor = activity_level === 'frequent' ? 1.55 : 1.2
    targetCaloriesPerDay = bmr * activityFactor

    if (goal === 'lose') targetCaloriesPerDay *= 0.8
    else if (goal === 'gain') targetCaloriesPerDay *= 1.3
  }

  targetCaloriesPerDay = Math.round(targetCaloriesPerDay)

  const dislikedMeals = (dislikes.dislikedMeals || []).map((item) => String(item))
  const dislikedGroups = (dislikes.dislikedGroups || []).map((item) => String(item))
  const dislikedIngredients = normalizeIngredients(dislikes.dislikedIngredients || [])

  const filteredMeals = allMeals.filter((meal) => {
    if (dislikedMeals.includes(meal.name)) return false
    if (dislikedGroups.includes(meal.group)) return false

    const mealIngredients = normalizeIngredients(meal.ingredients || [])
    if (mealIngredients.some((ingredient) => dislikedIngredients.some((disliked) => ingredient.includes(disliked)))) {
      return false
    }

    return true
  })

  if (filteredMeals.length < 5) {
    throw createHttpError('Not enough meals are available to generate suggestions.', 500)
  }

  const breakfastGroups = ['phở', 'bún', 'xôi', 'cháo', 'bánh mì']
  const lunchMainGroups = ['gà', 'cá', 'thịt heo', 'thịt bò', 'hải sản']
  const lunchVeggieGroups = ['rau củ', 'chay']
  const dinnerProteinGroups = ['gà', 'cá', 'hải sản']
  const dinnerVeggieGroups = ['rau củ', 'chay', 'trái cây']
  const dinnerLightGroups = ['cháo', 'súp']

  const breakfastPool = filteredMeals.filter(
    (meal) =>
      breakfastGroups.some((group) => String(meal.name || '').toLowerCase().includes(group) || meal.group === group),
  )
  const lunchMainPool = filteredMeals.filter((meal) => lunchMainGroups.includes(meal.group))
  const lunchVeggiePool = filteredMeals.filter(
    (meal) =>
      lunchVeggieGroups.includes(meal.group) ||
      String(meal.name || '').toLowerCase().includes('canh') ||
      String(meal.name || '').toLowerCase().includes('súp') ||
      String(meal.name || '').toLowerCase().includes('rau'),
  )
  const dinnerProteinPool = filteredMeals.filter((meal) => dinnerProteinGroups.includes(meal.group))
  const dinnerVeggiePool = filteredMeals.filter((meal) => dinnerVeggieGroups.includes(meal.group))
  const dinnerLightPool = filteredMeals.filter(
    (meal) => dinnerLightGroups.some((group) => String(meal.name || '').toLowerCase().includes(group) || meal.group === group),
  )

  if (!breakfastPool.length || !lunchMainPool.length || (!dinnerProteinPool.length && !dinnerLightPool.length)) {
    throw createHttpError('Unable to find a suitable meal plan for these preferences.', 500)
  }

  let bestPlan = null
  let bestGap = Number.POSITIVE_INFINITY

  for (let index = 0; index < 180; index += 1) {
    const usedIds = new Set()
    const breakfast = pickUniqueMeals(breakfastPool, 1, usedIds)
    const lunch = [...pickUniqueMeals(lunchMainPool, 1, usedIds), ...pickUniqueMeals(lunchVeggiePool, 1, usedIds)]
    const dinnerBasePool = dinnerProteinPool.length ? dinnerProteinPool : dinnerLightPool
    const dinner = [...pickUniqueMeals(dinnerBasePool, 1, usedIds), ...pickUniqueMeals(dinnerVeggiePool, 1, usedIds)]

    const planMeals = [...breakfast, ...lunch, ...dinner].filter(Boolean)
    if (!planMeals.length) continue

    const calories = planMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0)
    const gap = Math.abs(targetCaloriesPerDay - calories)

    if (gap < bestGap) {
      bestGap = gap
      bestPlan = { breakfast, lunch, dinner, calories }
    }
  }

  if (!bestPlan?.breakfast?.length) {
    throw createHttpError('Unable to find a suitable meal plan for these preferences.', 500)
  }

  return {
    targetCaloriesPerDay,
    selectedCalories: Math.round(bestPlan.calories),
    goal,
    bmi: bmi.toFixed(2),
    meals: [
      { meal: 'Breakfast', targetCalories: null, details: bestPlan.breakfast },
      { meal: 'Lunch', targetCalories: null, details: bestPlan.lunch },
      { meal: 'Dinner', targetCalories: null, details: bestPlan.dinner },
    ],
  }
}
