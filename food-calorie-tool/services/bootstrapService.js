const Meal = require('../models/Meal');
const initialMeals = require('../data/initialMeals');

async function seedDatabase({ forceReset = false } = {}) {
  try {
    if (forceReset) {
      await Meal.deleteMany({});
    }

    await Meal.insertMany(initialMeals, { ordered: false });
    console.log('Database seeded with', initialMeals.length, 'meals');
  } catch (error) {
    if (error?.code === 11000) {
      console.log('Meals already exist, skipping duplicate inserts');
      return;
    }

    console.error('Error seeding database:', error);
    throw error;
  }
}

async function ensureMealsSeeded() {
  const seedMode = (process.env.MEAL_SEED_MODE || 'if-empty').toLowerCase();

  if (seedMode === 'skip') {
    console.log('Meal seed skipped by MEAL_SEED_MODE=skip');
    return;
  }

  if (seedMode === 'force-reset') {
    await seedDatabase({ forceReset: true });
    return;
  }

  const mealCount = await Meal.countDocuments();

  if (mealCount > 0) {
    console.log(`Meals already present (${mealCount}), skipping seed`);
    return;
  }

  await seedDatabase();
}

module.exports = {
  ensureMealsSeeded,
  seedDatabase,
};
