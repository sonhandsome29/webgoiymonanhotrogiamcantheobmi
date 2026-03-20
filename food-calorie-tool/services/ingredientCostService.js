function parseIngredientString(ingredientStr) {
  const normalized = ingredientStr.toLowerCase().trim();
  const match = normalized.match(
    /^(\d+)\s*(g|gram|gr|kg|ml|l|lít|quả|trứng|bó|gói|hộp|lọ|trái)?\s*(.+)?$/i
  );

  let amount = null;
  let amountUnit = null;
  let namePart = normalized;

  if (match) {
    amount = Number.parseInt(match[1], 10);
    amountUnit = (match[2] || '').toLowerCase().trim();
    namePart = (match[3] || '').trim();
  }

  return { original: ingredientStr, normalized, amount, amountUnit, namePart };
}

function computePortionPrice(ingredient, amount, amountUnit) {
  if (!ingredient) return 0;

  const price = ingredient.price || 0;
  const dbUnit = (ingredient.unit || '').toLowerCase();
  const amt = amount || 0;
  let unit = (amountUnit || '').toLowerCase();

  if (unit === 'gr' || unit === 'gram') unit = 'g';

  if (!amt && !unit) return price;

  if (dbUnit === 'kg') {
    if (unit === 'g') return price * (amt / 1000);
    if (unit === 'kg') return price * amt;
  }

  if (dbUnit === '100g') {
    if (unit === 'g') return price * (amt / 100);
    if (unit === '100g') return price * amt;
  }

  if (dbUnit === 'lít' || dbUnit === 'lit' || dbUnit === 'l') {
    if (unit === 'ml') return price * (amt / 1000);
    if (unit === 'l' || unit === 'lít') return price * amt;
  }

  if (dbUnit === 'vỉ 10') {
    if (unit === 'quả' || unit === 'trứng') {
      return price * (amt / 10);
    }
    if (unit === 'vỉ') {
      return price * amt;
    }
  }

  if (dbUnit === 'bó' && (!unit || unit === 'bó')) return price * (amt || 1);
  if (dbUnit === 'hộp' && (!unit || unit === 'hộp')) return price * (amt || 1);
  if (dbUnit === 'lọ' && (!unit || unit === 'lọ')) return price * (amt || 1);
  if ((dbUnit === 'trái' || dbUnit === 'quả') && (!unit || unit === 'trái' || unit === 'quả')) {
    return price * (amt || 1);
  }
  if (dbUnit === 'gói' && (!unit || unit === 'gói')) return price * (amt || 1);

  return price;
}

function cleanIngredientName(parsed) {
  return (parsed.namePart || parsed.normalized)
    .replace(/^\d+\s*(g|gram|gr|kg|ml|l|lít)\s*/i, '')
    .replace(/^1\s*quả\s*/i, '')
    .trim();
}

function createIngredientLookupList(ingredients) {
  return ingredients.map((ingredient) => ({
    ...ingredient,
    name: (ingredient.name || '').toLowerCase(),
  }));
}

function findIngredientFromList(cleanedName, ingredientList) {
  if (!cleanedName) return null;

  const key = cleanedName.toLowerCase();

  return (
    ingredientList.find((ingredient) => key.includes(ingredient.name.toLowerCase())) ||
    ingredientList.find((ingredient) => ingredient.name.toLowerCase().includes(key)) ||
    null
  );
}

async function calcMealCost(meal, ingredientList) {
  if (!meal.ingredients || !Array.isArray(meal.ingredients)) return 0;

  let total = 0;

  for (const ingredientString of meal.ingredients) {
    const parsed = parseIngredientString(ingredientString);
    const cleanedName = cleanIngredientName(parsed);

    if (!cleanedName) continue;

    const ingredient = findIngredientFromList(cleanedName, ingredientList);
    const portionPrice = computePortionPrice(ingredient, parsed.amount, parsed.amountUnit);

    total += portionPrice;
  }

  return total;
}

function getMealIngredientCostDetails(meal, ingredientList) {
  let totalCost = 0;
  const details = [];

  if (meal.ingredients && Array.isArray(meal.ingredients)) {
    for (const ingredientString of meal.ingredients) {
      const parsed = parseIngredientString(ingredientString);
      const cleanedName = cleanIngredientName(parsed);

      if (!cleanedName) continue;

      const ingredient = findIngredientFromList(cleanedName, ingredientList);
      const price = computePortionPrice(ingredient, parsed.amount, parsed.amountUnit);

      totalCost += price;
      details.push({
        original: ingredientString,
        amount: parsed.amount,
        amountUnit: parsed.amountUnit,
        matchedIngredient: ingredient ? ingredient.name : null,
        unit: ingredient ? ingredient.unit : null,
        price,
      });
    }
  }

  return {
    totalCost: Math.round(totalCost),
    details,
  };
}

module.exports = {
  calcMealCost,
  cleanIngredientName,
  computePortionPrice,
  createIngredientLookupList,
  findIngredientFromList,
  getMealIngredientCostDetails,
  parseIngredientString,
};
