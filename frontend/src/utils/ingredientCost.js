export function parseIngredientString(ingredientStr) {
  const normalized = String(ingredientStr || '').toLowerCase().trim()
  const match = normalized.match(/^([\d.]+)\s*(g|gram|gr|kg|ml|l|lít|qua|quả|trung|trứng|bo|bó|goi|gói|hop|hộp|lo|lọ|trai|trái)?\s*(.+)?$/i)

  let amount = null
  let amountUnit = null
  let namePart = normalized

  if (match) {
    amount = Number.parseFloat(match[1])
    amountUnit = (match[2] || '').toLowerCase().trim()
    namePart = (match[3] || '').trim()
  }

  return { original: ingredientStr, normalized, amount, amountUnit, namePart }
}

export function computePortionPrice(ingredient, amount, amountUnit) {
  if (!ingredient) return 0

  const price = ingredient.price || 0
  const dbUnit = String(ingredient.unit || '').toLowerCase()
  const amt = amount || 0
  let unit = String(amountUnit || '').toLowerCase()

  if (unit === 'gr' || unit === 'gram') unit = 'g'
  if (unit === 'qua') unit = 'quả'
  if (unit === 'trung') unit = 'trứng'
  if (unit === 'bo') unit = 'bó'
  if (unit === 'goi') unit = 'gói'
  if (unit === 'hop') unit = 'hộp'
  if (unit === 'lo') unit = 'lọ'
  if (unit === 'trai') unit = 'trái'

  if (!amt && !unit) return price

  if (dbUnit === 'kg') {
    if (unit === 'g') return price * (amt / 1000)
    if (unit === 'kg') return price * amt
  }

  if (dbUnit === '100g') {
    if (unit === 'g') return price * (amt / 100)
    if (unit === '100g') return price * amt
  }

  if (dbUnit === 'lít' || dbUnit === 'lit' || dbUnit === 'l') {
    if (unit === 'ml') return price * (amt / 1000)
    if (unit === 'l' || unit === 'lít') return price * amt
  }

  if (dbUnit === 'vỉ 10') {
    if (unit === 'quả' || unit === 'trứng') return price * (amt / 10)
    if (unit === 'vỉ') return price * amt
  }

  if (dbUnit === 'bó' && (!unit || unit === 'bó')) return price * (amt || 1)
  if (dbUnit === 'hộp' && (!unit || unit === 'hộp')) return price * (amt || 1)
  if (dbUnit === 'lọ' && (!unit || unit === 'lọ')) return price * (amt || 1)
  if ((dbUnit === 'trái' || dbUnit === 'quả') && (!unit || unit === 'trái' || unit === 'quả')) return price * (amt || 1)
  if (dbUnit === 'gói' && (!unit || unit === 'gói')) return price * (amt || 1)

  return price
}

export function cleanIngredientName(parsed) {
  return String(parsed.namePart || parsed.normalized || '')
    .replace(/^\d+\s*(g|gram|gr|kg|ml|l|lít)\s*/i, '')
    .replace(/^1\s*quả\s*/i, '')
    .trim()
}

export function createIngredientLookupList(ingredients) {
  return ingredients.map((ingredient) => ({
    ...ingredient,
    name: String(ingredient.name || '').toLowerCase(),
  }))
}

export function findIngredientFromList(cleanedName, ingredientList) {
  if (!cleanedName) return null

  const key = cleanedName.toLowerCase()

  return (
    ingredientList.find((ingredient) => key.includes(ingredient.name.toLowerCase())) ||
    ingredientList.find((ingredient) => ingredient.name.toLowerCase().includes(key)) ||
    null
  )
}

export function calcMealCost(meal, ingredientList) {
  if (!Array.isArray(meal.ingredients)) return 0

  return meal.ingredients.reduce((total, ingredientString) => {
    const parsed = parseIngredientString(ingredientString)
    const cleanedName = cleanIngredientName(parsed)

    if (!cleanedName) return total

    const ingredient = findIngredientFromList(cleanedName, ingredientList)
    return total + computePortionPrice(ingredient, parsed.amount, parsed.amountUnit)
  }, 0)
}

export function buildShoppingListFromMeals(meals, ingredients) {
  const ingredientList = createIngredientLookupList(ingredients)
  const shoppingItems = []
  let totalPrice = 0

  meals.forEach((meal) => {
    ;(meal.ingredients || []).forEach((ingredientString) => {
      const parsed = parseIngredientString(ingredientString)
      const cleanedName = cleanIngredientName(parsed)

      if (!cleanedName) return

      const ingredient = findIngredientFromList(cleanedName, ingredientList)
      const price = Math.round(computePortionPrice(ingredient, parsed.amount, parsed.amountUnit))

      totalPrice += price
      shoppingItems.push({
        normalized: parsed.normalized,
        name: cleanedName,
        mealName: meal.mealName,
        mealType: meal.mealType,
        category: ingredient?.category || 'Uncategorized',
        price,
      })
    })
  })

  return {
    ingredients: shoppingItems,
    totalPrice: Math.round(totalPrice),
  }
}
