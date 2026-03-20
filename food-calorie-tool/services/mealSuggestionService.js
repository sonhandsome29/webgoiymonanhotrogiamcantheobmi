function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function buildMealSuggestion({
  allMeals,
  weight,
  height,
  age,
  gender,
  activity_level,
  dislikes = {},
  overrideTargetCalories,
}) {
  if (!weight || !height) {
    throw createHttpError(400, 'Weight and height are required');
  }

  let targetCaloriesPerDay;
  let goal = 'maintain';

  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);

  if (bmi >= 25) goal = 'lose';
  else if (bmi < 18.5) goal = 'gain';

  if (overrideTargetCalories) {
    targetCaloriesPerDay = overrideTargetCalories;
  } else {
    const userAge = age || 30;
    const genderConstant = gender === 'female' ? -161 : 5;
    const bmr = 10 * weight + 6.25 * height - 5 * userAge + genderConstant;
    const activityFactor = activity_level === 'frequent' ? 1.55 : 1.2;
    targetCaloriesPerDay = bmr * activityFactor;

    if (goal === 'lose') targetCaloriesPerDay *= 0.8;
    else if (goal === 'gain') targetCaloriesPerDay *= 1.3;
  }

  targetCaloriesPerDay = Math.round(targetCaloriesPerDay);

  const {
    dislikedMeals = [],
    dislikedGroups = [],
    dislikedIngredients = [],
  } = dislikes;

  const filteredMeals = allMeals.filter((meal) => {
    if (dislikedMeals.includes(meal.name)) return false;
    if (dislikedGroups.includes(meal.group)) return false;
    if (meal.ingredients && dislikedIngredients.some((ingredient) => meal.ingredients.includes(ingredient))) return false;
    return true;
  });

  if (filteredMeals.length < 5) {
    throw createHttpError(500, 'Not enough meals are available to generate suggestions.');
  }

  function runImprovedGA(meals, targetCalories, currentDislikes) {
    const breakfastComboGroups = ['phở', 'bún', 'xôi', 'cháo', 'bánh mì'];
    const lunchMainGroups = ['gà', 'cá', 'thịt heo', 'thịt bò', 'hải sản'];
    const lunchSoupVeggieGroups = ['rau củ', 'chay'];
    const dinnerLightProteinGroups = ['gà', 'cá', 'hải sản'];
    const dinnerVeggieGroups = ['rau củ', 'chay', 'trái cây'];
    const dinnerLightMealGroups = ['cháo', 'súp'];

    const {
      dislikedBreakfastGroups = [],
      dislikedLunchGroups = [],
      dislikedDinnerGroups = [],
    } = currentDislikes;

    const breakfastPool = meals.filter(
      (meal) =>
        (breakfastComboGroups.some((group) => meal.name.toLowerCase().includes(group)) ||
          breakfastComboGroups.includes(meal.group)) &&
        !dislikedBreakfastGroups.includes(meal.group)
    );

    const lunchMainPool = meals.filter(
      (meal) => lunchMainGroups.includes(meal.group) && !dislikedLunchGroups.includes(meal.group)
    );

    const lunchSoupVeggiePool = meals.filter(
      (meal) =>
        (lunchSoupVeggieGroups.includes(meal.group) ||
          meal.name.toLowerCase().includes('canh') ||
          meal.name.toLowerCase().includes('súp') ||
          meal.name.toLowerCase().includes('rau')) &&
        !dislikedLunchGroups.includes(meal.group)
    );

    const dinnerProteinPool = meals.filter(
      (meal) => dinnerLightProteinGroups.includes(meal.group) && !dislikedDinnerGroups.includes(meal.group)
    );

    const dinnerVeggiePool = meals.filter(
      (meal) => dinnerVeggieGroups.includes(meal.group) && !dislikedDinnerGroups.includes(meal.group)
    );

    const dinnerLightMealPool = meals.filter(
      (meal) =>
        (dinnerLightMealGroups.some((group) => meal.name.toLowerCase().includes(group)) ||
          dinnerLightMealGroups.includes(meal.group)) &&
        !dislikedDinnerGroups.includes(meal.group)
    );

    if (
      breakfastPool.length < 1 ||
      lunchMainPool.length < 1 ||
      (dinnerProteinPool.length < 1 && dinnerLightMealPool.length < 1)
    ) {
      return { breakfast: [], lunch: [], dinner: [] };
    }

    const populationSize = 120;
    const generations = 80;
    const mutationRate = 0.25;
    const eliteSize = 10;

    function getUniqueMealsImproved(count, usedIds, pool, maxRetries = 100) {
      if (!pool || pool.length === 0) return [];

      const selected = [];
      const attempts = new Set();
      let retries = 0;

      while (selected.length < count && retries < maxRetries) {
        const index = Math.floor(Math.random() * pool.length);
        const meal = pool[index];

        if (meal && !usedIds.has(meal._id.toString()) && !attempts.has(index)) {
          selected.push(meal);
          usedIds.add(meal._id.toString());
        }

        attempts.add(index);
        retries += 1;
      }

      return selected;
    }

    function pickBreakfastImproved(usedIds) {
      return getUniqueMealsImproved(1, usedIds, breakfastPool);
    }

    function pickLunch(usedIds) {
      const selectedMeals = [];

      const mainDish = getUniqueMealsImproved(1, usedIds, lunchMainPool);
      selectedMeals.push(...mainDish);

      if (Math.random() < 0.8 && lunchSoupVeggiePool.length > 0) {
        const soupVeggie = getUniqueMealsImproved(1, usedIds, lunchSoupVeggiePool);
        selectedMeals.push(...soupVeggie);
      }

      if (Math.random() < 0.3) {
        const fruitPool = allMeals.filter(
          (meal) => meal.group === 'trái cây' && !usedIds.has(meal._id.toString())
        );

        if (fruitPool.length > 0) {
          const fruit = getUniqueMealsImproved(1, usedIds, fruitPool);
          selectedMeals.push(...fruit);
        }
      }

      return selectedMeals;
    }

    function pickDinner(usedIds) {
      const selectedMeals = [];

      if (Math.random() < 0.5 && dinnerLightMealPool.length > 0) {
        const lightMeal = getUniqueMealsImproved(1, usedIds, dinnerLightMealPool);
        return lightMeal;
      }

      const protein = getUniqueMealsImproved(1, usedIds, dinnerProteinPool);
      selectedMeals.push(...protein);

      if (dinnerVeggiePool.length > 0) {
        const veggie = getUniqueMealsImproved(1, usedIds, dinnerVeggiePool);
        selectedMeals.push(...veggie);
      }

      return selectedMeals;
    }

    function createIndividualImproved() {
      const usedIds = new Set();

      const breakfast = pickBreakfastImproved(usedIds);
      const lunch = pickLunch(usedIds);
      const dinner = pickDinner(usedIds);

      if (breakfast.length < 1 || lunch.length < 1 || dinner.length < 1) {
        return createIndividualImproved();
      }

      const chosenMeals = [...breakfast, ...lunch, ...dinner];
      const uniqueIds = new Set(chosenMeals.map((meal) => meal._id.toString()));

      if (uniqueIds.size !== chosenMeals.length) {
        return createIndividualImproved();
      }

      return { breakfast, lunch, dinner };
    }

    function fitnessImproved(individual) {
      const chosenMeals = [...individual.breakfast, ...individual.lunch, ...individual.dinner];
      const totalCal = chosenMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

      if (totalCal > targetCalories) {
        return -Math.abs(totalCal - targetCalories) * 10;
      }

      const ratio = totalCal / targetCalories;
      let score = totalCal;

      if (ratio >= 0.9 && ratio <= 1.0) {
        score += 5000;
      } else if (ratio >= 0.8) {
        score += 2000;
      }

      const groups = new Set(chosenMeals.map((meal) => meal.group));
      score += groups.size * 500;

      const breakfastCal = individual.breakfast.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      const lunchCal = individual.lunch.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      const dinnerCal = individual.dinner.reduce((sum, meal) => sum + (meal.calories || 0), 0);

      const avgCal = totalCal / 3;
      const variance =
        Math.abs(breakfastCal - avgCal) +
        Math.abs(lunchCal - avgCal) +
        Math.abs(dinnerCal - avgCal);

      score -= variance * 0.5;

      return score;
    }

    function isValidImproved(individual) {
      const chosenMeals = [...individual.breakfast, ...individual.lunch, ...individual.dinner];
      if (chosenMeals.length < 4) return false;

      const allIds = chosenMeals.map((meal) => meal._id.toString());
      const uniqueIds = new Set(allIds);

      return uniqueIds.size === allIds.length;
    }

    function selectionWithElitism(population) {
      const valid = population.filter((item) => isValidImproved(item));
      if (valid.length === 0) return [];

      const sorted = valid.sort((left, right) => fitnessImproved(right) - fitnessImproved(left));
      const elite = sorted.slice(0, eliteSize);
      const selected = [...elite];
      const tournamentSize = 5;

      while (selected.length < populationSize / 2) {
        const tournament = [];
        for (let index = 0; index < tournamentSize; index += 1) {
          tournament.push(sorted[Math.floor(Math.random() * sorted.length)]);
        }
        tournament.sort((left, right) => fitnessImproved(right) - fitnessImproved(left));
        selected.push(tournament[0]);
      }

      return selected;
    }

    function crossoverImproved(parentOne, parentTwo) {
      const method = Math.random();

      let child;
      if (method < 0.33) {
        child = {
          breakfast: Math.random() < 0.5 ? [...parentOne.breakfast] : [...parentTwo.breakfast],
          lunch: Math.random() < 0.5 ? [...parentOne.lunch] : [...parentTwo.lunch],
          dinner: Math.random() < 0.5 ? [...parentOne.dinner] : [...parentTwo.dinner],
        };
      } else if (method < 0.66) {
        child = {
          breakfast: [...parentOne.breakfast],
          lunch: [...parentTwo.lunch],
          dinner: Math.random() < 0.5 ? [...parentOne.dinner] : [...parentTwo.dinner],
        };
      } else {
        child = {
          breakfast: [...parentTwo.breakfast],
          lunch: [...parentOne.lunch],
          dinner: [...parentOne.dinner],
        };
      }

      const usedIds = new Set();
      const chosenMeals = [...child.breakfast, ...child.lunch, ...child.dinner];

      for (const meal of chosenMeals) {
        if (usedIds.has(meal._id.toString())) {
          return createIndividualImproved();
        }
        usedIds.add(meal._id.toString());
      }

      return child;
    }

    function mutateImproved(individual) {
      const mutated = JSON.parse(JSON.stringify(individual));
      const allUsed = new Set(
        [...mutated.breakfast, ...mutated.lunch, ...mutated.dinner].map((meal) => meal._id.toString())
      );

      if (Math.random() < mutationRate) {
        mutated.breakfast.forEach((meal) => allUsed.delete(meal._id.toString()));
        mutated.breakfast = pickBreakfastImproved(allUsed);
        mutated.breakfast.forEach((meal) => allUsed.add(meal._id.toString()));
      }

      if (Math.random() < mutationRate) {
        mutated.lunch.forEach((meal) => allUsed.delete(meal._id.toString()));
        mutated.lunch = pickLunch(allUsed);
        mutated.lunch.forEach((meal) => allUsed.add(meal._id.toString()));
      }

      if (Math.random() < mutationRate) {
        mutated.dinner.forEach((meal) => allUsed.delete(meal._id.toString()));
        mutated.dinner = pickDinner(allUsed);
        mutated.dinner.forEach((meal) => allUsed.add(meal._id.toString()));
      }

      if (Math.random() < 0.1) {
        const temp = mutated.lunch;
        mutated.lunch = mutated.dinner;
        mutated.dinner = temp;
      }

      if (!isValidImproved(mutated)) {
        return createIndividualImproved();
      }

      return mutated;
    }

    let population = Array.from({ length: populationSize }, createIndividualImproved);

    for (let gen = 0; gen < generations; gen += 1) {
      const selected = selectionWithElitism(population);

      if (selected.length === 0) {
        continue;
      }

      const newPopulation = [...selected.slice(0, eliteSize)];

      while (newPopulation.length < populationSize) {
        const parentOne = selected[Math.floor(Math.random() * selected.length)];
        const parentTwo = selected[Math.floor(Math.random() * selected.length)];

        let child = crossoverImproved(parentOne, parentTwo);
        child = mutateImproved(child);

        newPopulation.push(child);
      }

      population = newPopulation;
    }

    const finalSelection = selectionWithElitism(population);
    return finalSelection.length > 0 ? finalSelection[0] : { breakfast: [], lunch: [], dinner: [] };
  }

  const bestMeal = runImprovedGA(filteredMeals, targetCaloriesPerDay, dislikes);

  if (!bestMeal || !bestMeal.breakfast || bestMeal.breakfast.length === 0) {
    throw createHttpError(500, 'Unable to find a suitable meal plan for these preferences.');
  }

  const selectedCalories = [...bestMeal.breakfast, ...bestMeal.lunch, ...bestMeal.dinner].reduce(
    (sum, meal) => sum + (meal.calories || 0),
    0
  );

  return {
    targetCaloriesPerDay,
    selectedCalories: Math.round(selectedCalories),
    goal,
    bmi: bmi.toFixed(2),
    meals: [
      {
        meal: 'Breakfast',
        targetCalories: null,
        details: bestMeal.breakfast,
      },
      {
        meal: 'Lunch',
        targetCalories: null,
        details: bestMeal.lunch,
      },
      {
        meal: 'Dinner',
        targetCalories: null,
        details: bestMeal.dinner,
      },
    ],
  };
}

module.exports = {
  buildMealSuggestion,
};
