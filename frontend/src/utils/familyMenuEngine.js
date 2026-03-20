import { calcMealCost, createIngredientLookupList } from './ingredientCost'

function createHttpError(message, status = 400, extra = {}) {
  const error = new Error(message)
  error.status = status
  Object.assign(error, extra)
  return error
}

function normalizeMealGroup(group = '') {
  return String(group).trim().toLowerCase()
}

function buildMealCosts(meals, ingredients) {
  const ingredientList = createIngredientLookupList(ingredients)

  return meals
    .map((meal) => ({ meal, cost: calcMealCost(meal, ingredientList) }))
    .filter((item) => item.cost > 0)
}

export function calculateFamilyMinCostLocal(meals, ingredients) {
  if (!meals.length || !ingredients.length) {
    throw createHttpError('Meal or ingredient data is missing.')
  }

  const mealCosts = buildMealCosts(meals, ingredients)

  if (mealCosts.length < 3) {
    throw createHttpError('Not enough priced meals are available yet.')
  }

  mealCosts.sort((left, right) => left.cost - right.cost)
  const cheapestMeals = mealCosts.slice(0, 3)
  const dailyCostPerPerson = cheapestMeals.reduce((sum, item) => sum + item.cost, 0)
  const baseWeeklyCostPerPerson = dailyCostPerPerson * 7
  const buffer = 50000

  return {
    minCostPerPerson: Math.round(baseWeeklyCostPerPerson + buffer),
    baseWeeklyCostPerPerson: Math.round(baseWeeklyCostPerPerson),
    buffer,
    dailyCostPerPerson: Math.round(dailyCostPerPerson),
    cheapestMeals: cheapestMeals.map((item) => ({ name: item.meal.name, cost: Math.round(item.cost) })),
    note: 'Estimated from 3 meals per day for 7 days using the 3 lowest-cost meals in the library, plus a 50,000 VND safety buffer.',
  }
}

export function buildFamilyMenuLocal({ meals, ingredients, familySize, weeklyBudget }) {
  if (!Number.isInteger(familySize) || familySize <= 0 || !Number.isFinite(weeklyBudget) || weeklyBudget <= 0) {
    throw createHttpError('Family size and weekly budget must be valid numbers.')
  }

  const mealCosts = buildMealCosts(meals, ingredients)

  if (mealCosts.length < 3) {
    throw createHttpError('Not enough meals are available to build a family menu.', 500)
  }

  const mainMealCosts = mealCosts.filter((item) => {
    const group = normalizeMealGroup(item.meal.group)
    return group !== 'rau củ' && group !== 'trái cây'
  })

  if (mainMealCosts.length < 3) {
    throw createHttpError('Not enough main meals are available to build a family menu.', 500)
  }

  mainMealCosts.sort((left, right) => left.cost - right.cost)
  const [cheapestBreakfast, cheapestLunch, cheapestDinner] = mainMealCosts
  const minCostPerPersonPerDay = cheapestBreakfast.cost + cheapestLunch.cost + cheapestDinner.cost
  const baseWeekCostMin = minCostPerPersonPerDay * familySize * 7
  const buffer = 50000
  const minTotalWeekCost = baseWeekCostMin + buffer

  if (weeklyBudget < minTotalWeekCost) {
    throw createHttpError(
      `This budget is too low. You need about ${Math.round(minTotalWeekCost)} VND per week for ${familySize} people, including the 50,000 VND buffer.`,
      400,
      { minBudget: Math.round(minTotalWeekCost) },
    )
  }

  const fruitMealCosts = mealCosts.filter((item) => normalizeMealGroup(item.meal.group) === 'trái cây')
  const weekdays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
  const maxBudgetPerPersonPerDay = (weeklyBudget - buffer) / 7 / familySize

  function pickMealsForOneDay() {
    let bestCombo = [cheapestBreakfast, cheapestLunch, cheapestDinner]
    let bestCost = minCostPerPersonPerDay

    for (let index = 0; index < 100; index += 1) {
      const a = mainMealCosts[Math.floor(Math.random() * mainMealCosts.length)]
      const b = mainMealCosts[Math.floor(Math.random() * mainMealCosts.length)]
      const c = mainMealCosts[Math.floor(Math.random() * mainMealCosts.length)]
      const unique = [a, b, c].filter((item, itemIndex, list) => list.indexOf(item) === itemIndex)
      if (unique.length < 3) continue

      const total = unique.reduce((sum, item) => sum + item.cost, 0)
      if (total <= maxBudgetPerPersonPerDay && total >= bestCost) {
        bestCombo = unique
        bestCost = total
      }
    }

    return bestCombo
  }

  function pickOneFruit() {
    if (!fruitMealCosts.length) return null
    const sorted = [...fruitMealCosts].sort((left, right) => left.cost - right.cost)
    const limit = Math.min(5, sorted.length)
    return sorted[Math.floor(Math.random() * limit)]
  }

  const days = weekdays.map((dayKeyVi) => {
    const [bCost, lCost, dCost] = pickMealsForOneDay()
    const fruit = pickOneFruit()
    const fruitMealType = Math.random() > 0.5 ? 'Bữa trưa' : 'Bữa tối'
    const dayMeals = [
      { mealTypeVi: 'Bữa sáng', dish: { mealId: bCost.meal._id, name: bCost.meal.name, calories: bCost.meal.calories || 0, pricePerPerson: Math.round(bCost.cost) } },
      { mealTypeVi: 'Bữa trưa', dish: { mealId: lCost.meal._id, name: lCost.meal.name, calories: lCost.meal.calories || 0, pricePerPerson: Math.round(lCost.cost) } },
      { mealTypeVi: 'Bữa tối', dish: { mealId: dCost.meal._id, name: dCost.meal.name, calories: dCost.meal.calories || 0, pricePerPerson: Math.round(dCost.cost) } },
    ]

    if (fruit) {
      dayMeals.push({
        mealTypeVi: fruitMealType,
        dish: { mealId: fruit.meal._id, name: fruit.meal.name, calories: fruit.meal.calories || 0, pricePerPerson: Math.round(fruit.cost), isFruit: true },
      })
    }

    const ingredientCount = dayMeals.reduce((sum, item) => sum + (item.dish ? 1 : 0), 0)
    const totalCost = Math.round(dayMeals.reduce((sum, item) => sum + ((item.dish?.pricePerPerson || 0) * familySize), 0))

    return { dayKeyVi, ingredientCount, totalCost, meals: dayMeals }
  })

  const totalWeekCost = days.reduce((sum, item) => sum + item.totalCost, 0) + buffer

  return {
    isBudgetEnough: true,
    totalWeekCost: Math.round(totalWeekCost),
    baseWeekCost: Math.round(totalWeekCost - buffer),
    buffer,
    familySize,
    days,
    minBudgetPerPerson: Math.round(minTotalWeekCost / familySize),
    minBudgetForFamily: Math.round(minTotalWeekCost),
  }
}
