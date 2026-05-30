// services/familyService.js
const Meal = require('../models/Meal');
const Ingredient = require('../models/Ingredient');

/**
 * Parse chuỗi nguyên liệu dạng:
 *  - "200g bún"
 *  - "50g cá"
 *  - "1 quả khổ qua"
 *  - "1 ổ bánh mì"
 *  - "pate"
 */
function parseIngredientString(str) {
  if (!str) return { amount: null, unit: null, name: '' };

  const s = str.toLowerCase().trim();

  // Có số đứng trước: 50g, 200ml, 1 quả, 2 hộp...
  const match = s.match(
    /^(\d+)\s*(g|gram|gr|kg|ml|l|lit|lít|trái|quả|ổ|cái|hộp|miếng|bó|gói|lọ|trung|trứng)?\s*(.+)?$/i
  );

  if (match) {
    const amount = parseInt(match[1], 10);
    let unit = match[2] ? match[2].toLowerCase() : null;
    const name = (match[3] || '').trim();

    // Chuẩn hóa đơn vị
    if (unit === 'gram' || unit === 'gr') unit = 'g';
    if (unit === 'lit') unit = 'lít';

    return { amount, unit, name };
  }

  // Không có số -> cả chuỗi là tên
  return { amount: null, unit: null, name: s };
}

/**
 * Tính giá tiền cho 1 nguyên liệu dựa vào:
 *  - ingredientDoc.price  & ingredientDoc.unit  (trong DB)
 *  - amount + unitHint    (từ chuỗi trong Meal.ingredients)
 */
function computePrice(ingredientDoc, amount, unitHint) {
  if (!ingredientDoc) return 0;

  const price = ingredientDoc.price || 0;
  const dbUnit = (ingredientDoc.unit || '').toLowerCase();
  let u = (unitHint || '').toLowerCase();

  // Chuẩn hóa các kiểu viết khác nhau
  if (u === 'gram' || u === 'gr') u = 'g';
  if (u === 'lit') u = 'lít';

  // helper: suy đoán gram từ amount + đơn vị
  const guessGrams = () => {
    if (!amount) return 100; // mặc định ~100g nếu không ghi rõ
    if (u === 'g') return amount;
    if (u === 'kg') return amount * 1000;
    // các đơn vị kiểu "ổ bánh mì", "quả", "cái", "miếng"... coi ~80g
    return amount * 80;
  };

  // 1. Giá theo kg
  if (dbUnit === 'kg') {
    const grams = guessGrams();
    const pricePerGram = price / 1000.0;
    return grams * pricePerGram;
  }

  // 2. Giá theo 100g
  if (dbUnit === '100g') {
    const grams = guessGrams();
    const pricePerGram = price / 100.0;
    return grams * pricePerGram;
  }

  // 3. Giá theo lít
  if (dbUnit === 'lít' || dbUnit === 'l') {
    let ml;
    if (!amount) {
      ml = 200; // mặc định 200ml
    } else if (u === 'ml') {
      ml = amount;
    } else if (u === 'l' || u === 'lít') {
      ml = amount * 1000;
    } else {
      ml = 200;
    }
    const pricePerMl = price / 1000.0;
    return ml * pricePerMl;
  }

  // 4. Vỉ 10 trứng
  if (dbUnit === 'vỉ 10') {
    let eggs;
    if (!amount) eggs = 2; // mặc định 2 quả
    else eggs = amount;
    const pricePerEgg = price / 10.0;
    return eggs * pricePerEgg;
  }

  // 5. Đơn vị tính theo "hộp", "bó", "gói", "lọ", "trái", "ổ"
  if (['hộp', 'bó', 'gói', 'lọ', 'trái', 'ổ'].includes(dbUnit)) {
    const count = amount || 1;
    return price * count;
  }

  // Nếu không match, trả về 0 để khỏi crash
  return 0;
}

/**
 * Tính totalCost cho 1 món ăn (Meal)
 */
async function computeMealCost(meal) {
  let total = 0;

  for (const ingStr of meal.ingredients || []) {
    const { amount, unit, name } = parseIngredientString(ingStr);

    if (!name) continue;

    // tìm nguyên liệu trong DB theo tên gần giống
    let ingDoc = await Ingredient.findOne({
      name: { $regex: name, $options: 'i' },
    });

    // nếu không tìm được, thử cách khác: lấy từ khóa cuối cùng
    if (!ingDoc) {
      const parts = name.split(' ');
      const lastWord = parts[parts.length - 1];
      ingDoc = await Ingredient.findOne({
        name: { $regex: lastWord, $options: 'i' },
      });
    }

    if (!ingDoc) continue; // bỏ qua nếu vẫn không có

    total += computePrice(ingDoc, amount, unit);
  }

  return total;
}

/**
 * Helper: tính danh sách {meal, costPerServing} cho tất cả món trong DB
 */
async function buildMealCostList() {
  const meals = await Meal.find();
  const items = await Promise.all(
    meals.map(async (m) => {
      const cost = await computeMealCost(m);
      return { meal: m, costPerServing: cost };
    })
  );

  // Lọc bỏ món có cost = 0
  return items.filter((x) => x.costPerServing > 0);
}

/**
 * GET /family/min-cost
 * Trả về chi phí tối thiểu ước tính cho 1 người / 1 tuần
 * Giả sử: 3 bữa / ngày, 1 món / bữa, dùng nhóm món rẻ nhất.
 */
async function getMinimumCostPerPerson(req, res) {
  try {
    const list = await buildMealCostList();

    if (!list.length) {
      return res.status(404).json({
        error: 'Không có dữ liệu món ăn hoặc nguyên liệu để tính chi phí.',
      });
    }

    // sắp xếp theo giá rẻ -> đắt
    list.sort((a, b) => a.costPerServing - b.costPerServing);

    // lấy trung bình 10 món rẻ nhất cho bữa "tiết kiệm"
    const take = Math.min(10, list.length);
    const cheapest = list.slice(0, take);

    const avgMealCost =
      cheapest.reduce((sum, item) => sum + item.costPerServing, 0) / take;

    const perDayCost = avgMealCost * 3; // 3 bữa / ngày
    const perWeekCost = perDayCost * 7; // 7 ngày

    return res.json({
      success: true,
      // tên field mới bạn đang dùng
      perDayCost: Math.round(perDayCost),
      perWeekCost: Math.round(perWeekCost),
      avgMealCost: Math.round(avgMealCost),
      // tên field cũ để frontend nào đang xài cũng đọc được
      minCostPerPersonPerWeek: Math.round(perWeekCost),
      minCostPerDay: Math.round(perDayCost),
      currency: 'VND',
      note:
        'Ước tính dựa trên 10 món rẻ nhất, 3 bữa/ngày, 1 món/bữa (nguyên liệu tính theo 100g, 50g,...).',
    });
  } catch (err) {
    console.error('Lỗi getMinimumCostPerPerson:', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /family/generate-menu
 * body: { members: số người, budget: ngân_sách_1_tuần }
 * Trả về menu 7 ngày, mỗi ngày 3 bữa (1 món/bữa) + tổng tiền / ngày / tuần.
 */
async function generateMenu(req, res) {
  try {
    let { members, budget } = req.body;

    // Ép kiểu về số
    members = parseInt(members, 10);
    budget  = parseInt(budget, 10);

    if (!members || !budget || members <= 0 || budget <= 0) {
      return res
        .status(400)
        .json({ error: 'Thiếu tham số members hoặc budget.' });
    }

    const list = await buildMealCostList();
    if (!list.length) {
      return res.status(404).json({
        error: 'Không có dữ liệu món ăn hoặc nguyên liệu để tạo menu.',
      });
    }

    // Sắp xếp rẻ -> đắt
    list.sort((a, b) => a.costPerServing - b.costPerServing);

    // Tính chi phí tối thiểu cho 1 người / tuần để kiểm tra ngân sách
    const take = Math.min(10, list.length);
    const cheapest = list.slice(0, take);
    const avgMealCost =
      cheapest.reduce((sum, item) => sum + item.costPerServing, 0) / take;

    const minPerPersonPerWeek = avgMealCost * 3 * 7;
    const minTotalWeek = minPerPersonPerWeek * members;

    if (budget < minTotalWeek) {
      return res.status(400).json({
        error:
          'Ngân sách quá thấp, không đủ cho ' +
          members +
          ' khẩu phần / tuần.',
        minRequired: Math.round(minTotalWeek),
      });
    }

    // Để menu "kinh tế" hơn: random trong 50% món rẻ nhất
    const affordableList = list.slice(
      0,
      Math.max(10, Math.floor(list.length * 0.5))
    );

    const daysVN = [
      'Thứ 2',
      'Thứ 3',
      'Thứ 4',
      'Thứ 5',
      'Thứ 6',
      'Thứ 7',
      'Chủ nhật',
    ];
    const mealTypes = ['Bữa sáng', 'Bữa trưa', 'Bữa tối'];

    const menu = [];
    const rand = (max) => Math.floor(Math.random() * max);

    let totalCostAllDays = 0;

    for (let i = 0; i < 7; i++) {
      const dayName = daysVN[i];

      const dayMeals = [];
      let dayCostOnePerson = 0;

      for (const mealType of mealTypes) {
        const picked = affordableList[rand(affordableList.length)]; // random 1 món trong nhóm rẻ
        const oneServingCost = picked.costPerServing;

        dayMeals.push({
          mealType,
          name: picked.meal.name,
          calories: picked.meal.calories,
          group: picked.meal.group,
          ingredients: picked.meal.ingredients,
          costPerServing: Math.round(oneServingCost),
        });

        dayCostOnePerson += oneServingCost;
      }

      const dayCostAllMembers = dayCostOnePerson * members;
      totalCostAllDays += dayCostAllMembers;

      menu.push({
        day: dayName,
        totalCostPerDayOnePerson: Math.round(dayCostOnePerson),
        totalCostPerDayAllMembers: Math.round(dayCostAllMembers),
        totalIngredientsCount: dayMeals
          .map((m) => m.ingredients?.length || 0)
          .reduce((a, b) => a + b, 0),
        meals: dayMeals,
      });
    }

    return res.json({
      success: true,
      members,
      budget,
      estimatedTotalCost: Math.round(totalCostAllDays),
      remainingBudget: Math.round(budget - totalCostAllDays),
      perPersonMinWeekCost: Math.round(minPerPersonPerWeek),
      menu,
    });
  } catch (err) {
    console.error('Lỗi generateMenu:', err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getMinimumCostPerPerson,
  generateMenu,
};
