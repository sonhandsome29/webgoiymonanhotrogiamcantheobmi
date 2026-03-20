const { calcMealCost, createIngredientLookupList } = require('./ingredientCostService');

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeMealGroup(group = '') {
  return String(group).trim().toLowerCase();
}

async function buildMealCosts(meals, ingredients) {
  const ingredientList = createIngredientLookupList(ingredients);
  const mealCosts = [];

  for (const meal of meals) {
    const cost = await calcMealCost(meal, ingredientList);
    if (cost > 0) {
      mealCosts.push({ meal, cost });
    }
  }

  return mealCosts;
}

async function calculateFamilyMinCost(meals, ingredients) {
  if (!meals.length || !ingredients.length) {
    throw createHttpError(400, 'Meal or ingredient data is missing.');
  }

  const mealCosts = await buildMealCosts(meals, ingredients);

  if (mealCosts.length < 3) {
    throw createHttpError(400, 'Not enough priced meals are available yet.');
  }

  mealCosts.sort((left, right) => left.cost - right.cost);
  const cheapestMeals = mealCosts.slice(0, 3);

  const dailyCostPerPerson = cheapestMeals.reduce((sum, item) => sum + (item.cost || 0), 0);
  const baseWeeklyCostPerPerson = dailyCostPerPerson * 7;
  const buffer = 50000;
  const weeklyCostPerPerson = baseWeeklyCostPerPerson + buffer;

  return {
    minCostPerPerson: Math.round(weeklyCostPerPerson),
    baseWeeklyCostPerPerson: Math.round(baseWeeklyCostPerPerson),
    buffer,
    dailyCostPerPerson: Math.round(dailyCostPerPerson),
    cheapestMeals: cheapestMeals.map((item) => ({
      name: item.meal.name,
      cost: Math.round(item.cost || 0),
    })),
    note:
      'Estimated from 3 meals per day for 7 days using the 3 lowest-cost meals in the library, plus a 50,000 VND safety buffer.',
  };
}

async function buildFamilyMenu({ meals, ingredients, familySize, weeklyBudget }) {
  if (!Number.isInteger(familySize) || familySize <= 0 || !Number.isFinite(weeklyBudget) || weeklyBudget <= 0) {
    throw createHttpError(400, 'Family size and weekly budget must be valid numbers.');
  }

  if (!meals.length || !ingredients.length) {
    throw createHttpError(400, 'Meal or ingredient data is missing.');
  }

  const mealCosts = await buildMealCosts(meals, ingredients);

  if (mealCosts.length < 3) {
    throw createHttpError(500, 'Not enough meals are available to build a family menu.');
  }

  const mainMealCosts = mealCosts.filter((item) => {
    const group = normalizeMealGroup(item.meal.group);
    return group !== 'rau củ' && group !== 'trái cây';
  });

  if (mainMealCosts.length < 3) {
    throw createHttpError(500, 'Not enough main meals are available to build a family menu.');
  }

  mainMealCosts.sort((left, right) => left.cost - right.cost);

  const [cheapestBreakfast, cheapestLunch, cheapestDinner] = mainMealCosts;
  const minCostPerPersonPerDay =
    (cheapestBreakfast.cost || 0) + (cheapestLunch.cost || 0) + (cheapestDinner.cost || 0);

  const minCostPerFamilyPerDay = minCostPerPersonPerDay * familySize;
  const baseWeekCostMin = minCostPerFamilyPerDay * 7;
  const buffer = 50000;
  const minTotalWeekCost = baseWeekCostMin + buffer;
  const fruitMealCosts = mealCosts.filter((item) => normalizeMealGroup(item.meal.group) === 'trái cây');

  if (weeklyBudget < minTotalWeekCost) {
    throw Object.assign(
        createHttpError(
          400,
          `This budget is too low. You need about ${Math.round(minTotalWeekCost)} VND per week for ${familySize} people, including the 50,000 VND buffer.`
        ),
      { minBudget: Math.round(minTotalWeekCost) }
    );
  }

  const weekdays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  const maxBudgetPerFamilyPerDay = (weeklyBudget - buffer) / 7;
  const maxBudgetPerPersonPerDay = maxBudgetPerFamilyPerDay / familySize;

  function pickMealsForOneDay(costList, maxPerPersonDay) {
    if (costList.length < 3) {
      return [cheapestBreakfast, cheapestLunch, cheapestDinner];
    }

    const maxTries = 100;
    let bestCombo = [cheapestBreakfast, cheapestLunch, cheapestDinner];
    let bestCost = minCostPerPersonPerDay;

    for (let index = 0; index < maxTries; index += 1) {
      const idx1 = Math.floor(Math.random() * costList.length);
      let idx2 = Math.floor(Math.random() * costList.length);
      let idx3 = Math.floor(Math.random() * costList.length);

      if (idx2 === idx1) idx2 = (idx2 + 1) % costList.length;
      if (idx3 === idx1 || idx3 === idx2) idx3 = (idx3 + 2) % costList.length;

      const c1 = costList[idx1];
      const c2 = costList[idx2];
      const c3 = costList[idx3];
      const total = (c1.cost || 0) + (c2.cost || 0) + (c3.cost || 0);

      if (total <= maxPerPersonDay && total >= bestCost) {
        bestCombo = [c1, c2, c3];
        bestCost = total;
      }
    }

    return bestCombo;
  }

  function pickOneFruit(fruitList) {
    if (!fruitList || fruitList.length === 0) return null;

    const sorted = [...fruitList].sort((left, right) => left.cost - right.cost);
    const limit = Math.min(5, sorted.length);
    return sorted[Math.floor(Math.random() * limit)];
  }

  const days = weekdays.map((dayKeyVi) => {
    const [bCost, lCost, dCost] = pickMealsForOneDay(mainMealCosts, maxBudgetPerPersonPerDay);
    const fruit = pickOneFruit(fruitMealCosts);
    const fruitMealType = Math.random() > 0.5 ? 'Bữa trưa' : 'Bữa tối';

    const costPerPersonPerDay =
      (bCost.cost || 0) + (lCost.cost || 0) + (dCost.cost || 0) + (fruit?.cost || 0);
    const costPerFamilyPerDay = costPerPersonPerDay * familySize;
    const ingredientCount =
      (bCost.meal.ingredients?.length || 0) +
      (lCost.meal.ingredients?.length || 0) +
      (dCost.meal.ingredients?.length || 0) +
      (fruit?.meal.ingredients?.length || 0);

    const dailyMeals = [
      {
        mealTypeVi: 'Bữa sáng',
        dish: {
          mealId: bCost.meal._id,
          name: bCost.meal.name,
          calories: bCost.meal.calories || 0,
          pricePerPerson: Math.round(bCost.cost || 0),
        },
      },
      {
        mealTypeVi: 'Bữa trưa',
        dish: {
          mealId: lCost.meal._id,
          name: lCost.meal.name,
          calories: lCost.meal.calories || 0,
          pricePerPerson: Math.round(lCost.cost || 0),
        },
      },
      {
        mealTypeVi: 'Bữa tối',
        dish: {
          mealId: dCost.meal._id,
          name: dCost.meal.name,
          calories: dCost.meal.calories || 0,
          pricePerPerson: Math.round(dCost.cost || 0),
        },
      },
    ];

    if (fruit) {
      dailyMeals.push({
        mealTypeVi: fruitMealType,
        dish: {
          mealId: fruit.meal._id,
          name: fruit.meal.name,
          calories: fruit.meal.calories || 0,
          pricePerPerson: Math.round(fruit.cost || 0),
          isFruit: true,
        },
      });
    }

    return {
      dayKeyVi,
      ingredientCount,
      totalCost: Math.round(costPerFamilyPerDay),
      meals: dailyMeals,
    };
  });

  const totalWeekCost = days.reduce((sum, item) => sum + (item.totalCost || 0), 0) + buffer;
  const baseWeekCost = totalWeekCost - buffer;
  const minBudgetPerPerson = Math.round(minTotalWeekCost / familySize);
  const minBudgetForFamily = Math.round(minTotalWeekCost);

  return {
    isBudgetEnough: true,
    totalWeekCost: Math.round(totalWeekCost),
    baseWeekCost: Math.round(baseWeekCost),
    buffer,
    familySize,
    days,
    minBudgetPerPerson,
    minBudgetForFamily,
  };
}

module.exports = {
  buildFamilyMenu,
  calculateFamilyMinCost,
  normalizeMealGroup,
};
