require('dotenv').config();
const express = require('express');
const connectDB = require('./db');
const Meal = require('./models/Meal');
const User = require('./models/User');
const MealHistory = require('./models/MealHistory');
const Ingredient = require('./models/Ingredient');
const bcrypt = require('bcrypt');
const path = require('path');
const seedIngredients = require('./seedIngredients');
const FamilyMenuResult = require('./models/FamilyMenuResult');

const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Phục vụ tệp tĩnh từ thư mục public
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Kết nối MongoDB
connectDB();
const fs = require('fs');

let initialMeals = [];
try {
    initialMeals = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'seedMeals.json'), 'utf8'));
} catch (err) {
    console.error('Failed to load seed meals from seedMeals.json:', err);
}

const mongoose = require('mongoose');
// Middleware đảm bảo kết nối DB trước khi xử lý request
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next();
  } else {
    // Nếu chưa kết nối, đợi kết nối hoàn tất
    const interval = setInterval(() => {
      if (mongoose.connection.readyState === 1) {
        clearInterval(interval);
        next();
      }
    }, 100);
    // Timeout sau 5 giây nếu không kết nối được
    setTimeout(() => {
      if (mongoose.connection.readyState !== 1) {
        clearInterval(interval);
        res.status(500).json({ error: 'Database connection timeout' });
      }
    }, 5000);
  }
});

const seedDatabase = async () => {
    try {
        const count = await Meal.countDocuments();
        if (count === 0) {
            await Meal.insertMany(initialMeals);
            console.log('Database seeded with', initialMeals.length, 'meals');
        } else {
            console.log('Database already has', count, 'meals. Skipping seed.');
        }
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};
// Đợi connection sẵn sàng rồi mới seed
mongoose.connection.once('open', () => {
    seedDatabase();
});

// ======================================================
// =============== API GỢI Ý BỮA ĂN (GA) ===============
// ======================================================

// ======================================================
// ========= CẢI TIẾN THUẬT TOÁN GA GỢI Ý MÓN ĂN =========
// ======================================================

app.post('/suggest-meals', async (req, res) => {
  const { 
    weight, 
    height, 
    age,
    gender,
    activity_level,
    dislikes = {},
    overrideTargetCalories
  } = req.body;

  if (!weight || !height) {
    return res.status(400).json({ error: 'Weight and height are required' });
  }

  let targetCaloriesPerDay;
  let goal = "maintain";
  let bmi = 0;

  const heightInMeters = height / 100;
  bmi = weight / (heightInMeters * heightInMeters);
  if (bmi >= 25) goal = "lose";
  else if (bmi < 18.5) goal = "gain";

  if (overrideTargetCalories) {
    targetCaloriesPerDay = overrideTargetCalories;
  } else {
    const userAge = age || 30;
    const genderConstant = (gender === 'female') ? -161 : 5;
    const bmr = 10 * weight + 6.25 * height - 5 * userAge + genderConstant;
    const activityFactor = (activity_level === 'frequent') ? 1.55 : 1.2;
    targetCaloriesPerDay = bmr * activityFactor;

    if (goal === "lose") targetCaloriesPerDay *= 0.8;
    else if (goal === "gain") targetCaloriesPerDay *= 1.3;
  }

  targetCaloriesPerDay = Math.round(targetCaloriesPerDay);

  const allMeals = await Meal.find();
  const {
    dislikedMeals = [],
    dislikedGroups = [],
    dislikedIngredients = []
  } = dislikes;

  const filteredMeals = allMeals.filter(meal => {
    if (dislikedMeals.includes(meal.name)) return false;
    if (dislikedGroups.includes(meal.group)) return false;
    if (meal.ingredients && dislikedIngredients.some(ing => meal.ingredients.includes(ing))) return false;
    return true;
  });

  if (filteredMeals.length < 5) {
    return res.status(500).json({ error: 'Không đủ món ăn để gợi ý' });
  }

  function runImprovedGA(meals, targetCalories, dislikes) {
    // ===== PHÂN LOẠI MÓN ĂN THEO THÓI QUEN VIỆT NAM =====
    
    // 1. BỮA SÁNG: Món tổ hợp (1 món đủ chất)
    const breakfastComboGroups = ['phở', 'bún', 'xôi', 'cháo', 'bánh mì'];
    
    // 2. BỮA TRƯA: Món chính + canh/rau + phụ
    const lunchMainGroups = ['gà', 'cá', 'thịt heo', 'thịt bò', 'hải sản']; // Món mặn chủ đạo
    const lunchSoupVeggieGroups = ['rau củ', 'chay']; // Canh/rau
    
    // 3. BỮA TỐI: Nhẹ hơn - ưu tiên rau và đạm ít mỡ
    const dinnerLightProteinGroups = ['gà', 'cá', 'hải sản']; // Đạm nhẹ (tránh heo, bò)
    const dinnerVeggieGroups = ['rau củ', 'chay', 'trái cây']; // Nhiều rau
    const dinnerLightMealGroups = ['cháo', 'súp']; // Món nước nhẹ

    const {
      dislikedBreakfastGroups = [],
      dislikedLunchGroups = [],
      dislikedDinnerGroups = []
    } = dislikes;

    // ===== TẠO CÁC POOL MÓN ĂN =====
    
    // Bữa sáng: Chỉ lấy các món tổ hợp
    const breakfastPool = meals.filter(m =>
      (breakfastComboGroups.some(g => m.name.toLowerCase().includes(g)) ||
       breakfastComboGroups.includes(m.group)) &&
      !dislikedBreakfastGroups.includes(m.group)
    );

    // Bữa trưa - Món chính
    const lunchMainPool = meals.filter(m =>
      lunchMainGroups.includes(m.group) &&
      !dislikedLunchGroups.includes(m.group)
    );

    // Bữa trưa - Canh/Rau
    const lunchSoupVeggiePool = meals.filter(m =>
      (lunchSoupVeggieGroups.includes(m.group) ||
       m.name.toLowerCase().includes('canh') ||
       m.name.toLowerCase().includes('súp') ||
       m.name.toLowerCase().includes('rau')) &&
      !dislikedLunchGroups.includes(m.group)
    );

    // Bữa tối - Đạm nhẹ (gà, cá, hải sản)
    const dinnerProteinPool = meals.filter(m =>
      dinnerLightProteinGroups.includes(m.group) &&
      !dislikedDinnerGroups.includes(m.group)
    );

    // Bữa tối - Rau củ
    const dinnerVeggiePool = meals.filter(m =>
      dinnerVeggieGroups.includes(m.group) &&
      !dislikedDinnerGroups.includes(m.group)
    );

    // Bữa tối - Món nước nhẹ (cháo, súp)
    const dinnerLightMealPool = meals.filter(m =>
      (dinnerLightMealGroups.some(g => m.name.toLowerCase().includes(g)) ||
       dinnerLightMealGroups.includes(m.group)) &&
      !dislikedDinnerGroups.includes(m.group)
    );

    // Kiểm tra đủ món trong các pool
    if (breakfastPool.length < 1 ||
        lunchMainPool.length < 1 ||
        (dinnerProteinPool.length < 1 && dinnerLightMealPool.length < 1)) {
      console.error("Không đủ món ăn trong các pool");
      return { breakfast: [], lunch: [], dinner: [] };
    }

    const populationSize = 120;
    const generations = 80;
    const mutationRate = 0.25;
    const eliteSize = 10;

    // ===== HÀM LẤY MÓN UNIQUE =====
    function getUniqueMealsImproved(count, usedIds, pool, maxRetries = 100) {
      if (!pool || pool.length === 0) return [];
      
      const selected = [];
      const attempts = new Set();
      let retries = 0;

      while (selected.length < count && retries < maxRetries) {
        const idx = Math.floor(Math.random() * pool.length);
        const meal = pool[idx];
        
        if (meal && !usedIds.has(meal._id.toString()) && !attempts.has(idx)) {
          selected.push(meal);
          usedIds.add(meal._id.toString());
        }
        
        attempts.add(idx);
        retries++;
      }

      return selected;
    }

    // ===== CHỌN BỮA SÁNG: 1 MÓN TỔ HỢP =====
    function pickBreakfastImproved(usedIds) {
      // Luôn chọn 1 món tổ hợp duy nhất
      return getUniqueMealsImproved(1, usedIds, breakfastPool);
    }

    // ===== CHỌN BỮA TRƯA: 2-3 MÓN (Mặn + Canh/Rau + Phụ) =====
    function pickLunch(usedIds) {
      const meals = [];
      
      // 1. Món mặn chủ đạo (BẮT BUỘC)
      const mainDish = getUniqueMealsImproved(1, usedIds, lunchMainPool);
      meals.push(...mainDish);
      
      // 2. Canh hoặc rau (BẮT BUỘC - 80% canh/rau, 20% trái cây)
      if (Math.random() < 0.8 && lunchSoupVeggiePool.length > 0) {
        const soupVeggie = getUniqueMealsImproved(1, usedIds, lunchSoupVeggiePool);
        meals.push(...soupVeggie);
      }
      
      // 3. Món phụ (TÙY CHỌN - 30% cơ hội thêm trái cây)
      if (Math.random() < 0.3) {
        const fruitPool = allMeals.filter(m => 
          m.group === 'trái cây' && !usedIds.has(m._id.toString())
        );
        if (fruitPool.length > 0) {
          const fruit = getUniqueMealsImproved(1, usedIds, fruitPool);
          meals.push(...fruit);
        }
      }
      
      return meals;
    }

    // ===== CHỌN BỮA TỐI: 2 MÓN hoặc 1 MÓN NHẸ =====
    function pickDinner(usedIds) {
      const meals = [];
      
      // 50% cơ hội chọn món nước nhẹ (cháo, súp) - 1 MÓN DUY NHẤT
      if (Math.random() < 0.5 && dinnerLightMealPool.length > 0) {
        const lightMeal = getUniqueMealsImproved(1, usedIds, dinnerLightMealPool);
        return lightMeal; // Trả về ngay 1 món
      }
      
      // 50% còn lại: 2 món (Đạm nhẹ + Rau)
      // 1. Món đạm nhẹ (gà/cá/hải sản)
      const protein = getUniqueMealsImproved(1, usedIds, dinnerProteinPool);
      meals.push(...protein);
      
      // 2. Món rau (BẮT BUỘC)
      if (dinnerVeggiePool.length > 0) {
        const veggie = getUniqueMealsImproved(1, usedIds, dinnerVeggiePool);
        meals.push(...veggie);
      }
      
      return meals;
    }

    // Tạo individual với đảm bảo unique
    function createIndividualImproved() {
      const usedIds = new Set();
      
      const breakfast = pickBreakfastImproved(usedIds);
      const lunch = pickLunch(usedIds);
      const dinner = pickDinner(usedIds);

      // Validate: phải có ít nhất 4 món và không trùng
      if (breakfast.length < 1 || lunch.length < 1 || dinner.length < 1) {
        return createIndividualImproved(); // Retry
      }

      const allMeals = [...breakfast, ...lunch, ...dinner];
      const uniqueIds = new Set(allMeals.map(m => m._id.toString()));
      
      if (uniqueIds.size !== allMeals.length) {
        return createIndividualImproved(); // Retry if duplicates
      }

      return { breakfast, lunch, dinner };
    }

    // Fitness function cải tiến
    function fitnessImproved(ind) {
      const allMeals = [...ind.breakfast, ...ind.lunch, ...ind.dinner];
      const totalCal = allMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
      
      // Penalty nếu vượt target
      if (totalCal > targetCalories) {
        return -Math.abs(totalCal - targetCalories) * 10;
      }
      
      // Reward gần target (trong khoảng 90-100% target)
      const ratio = totalCal / targetCalories;
      let score = totalCal;
      
      if (ratio >= 0.9 && ratio <= 1.0) {
        score += 5000; // Bonus lớn cho khoảng tốt
      } else if (ratio >= 0.8) {
        score += 2000; // Bonus trung bình
      }
      
      // Bonus cho đa dạng nhóm món
      const groups = new Set(allMeals.map(m => m.group));
      score += groups.size * 500; // Khuyến khích đa dạng
      
      // Bonus cho cân bằng calo giữa các bữa
      const breakfastCal = ind.breakfast.reduce((s, m) => s + (m.calories || 0), 0);
      const lunchCal = ind.lunch.reduce((s, m) => s + (m.calories || 0), 0);
      const dinnerCal = ind.dinner.reduce((s, m) => s + (m.calories || 0), 0);
      
      const avgCal = totalCal / 3;
      const variance = Math.abs(breakfastCal - avgCal) + 
                      Math.abs(lunchCal - avgCal) + 
                      Math.abs(dinnerCal - avgCal);
      
      score -= variance * 0.5; // Penalty cho mất cân bằng
      
      return score;
    }

    // Validate individual
    function isValidImproved(ind) {
      const allMeals = [...ind.breakfast, ...ind.lunch, ...ind.dinner];
      if (allMeals.length < 4) return false;
      
      const allIds = allMeals.map(m => m._id.toString());
      const uniqueIds = new Set(allIds);
      
      return uniqueIds.size === allIds.length; // Không có trùng lặp
    }

    // Selection với elitism
    function selectionWithElitism(population) {
      const valid = population.filter(p => isValidImproved(p));
      if (valid.length === 0) return [];
      
      const sorted = valid.sort((a, b) => fitnessImproved(b) - fitnessImproved(a));
      
      // Giữ lại elite
      const elite = sorted.slice(0, eliteSize);
      
      // Tournament selection cho phần còn lại
      const selected = [...elite];
      const tournamentSize = 5;
      
      while (selected.length < populationSize / 2) {
        const tournament = [];
        for (let i = 0; i < tournamentSize; i++) {
          tournament.push(sorted[Math.floor(Math.random() * sorted.length)]);
        }
        tournament.sort((a, b) => fitnessImproved(b) - fitnessImproved(a));
        selected.push(tournament[0]);
      }
      
      return selected;
    }

    // Crossover cải tiến
    function crossoverImproved(p1, p2) {
      // Thử nhiều cách crossover khác nhau
      const method = Math.random();
      
      let child;
      if (method < 0.33) {
        // Uniform crossover
        child = {
          breakfast: Math.random() < 0.5 ? [...p1.breakfast] : [...p2.breakfast],
          lunch: Math.random() < 0.5 ? [...p1.lunch] : [...p2.lunch],
          dinner: Math.random() < 0.5 ? [...p1.dinner] : [...p2.dinner]
        };
      } else if (method < 0.66) {
        // Mix breakfast from p1, lunch from p2, dinner mixed
        child = {
          breakfast: [...p1.breakfast],
          lunch: [...p2.lunch],
          dinner: Math.random() < 0.5 ? [...p1.dinner] : [...p2.dinner]
        };
      } else {
        // Partial mix
        child = {
          breakfast: [...p2.breakfast],
          lunch: [...p1.lunch],
          dinner: [...p1.dinner]
        };
      }

      // Check và fix duplicates
      const usedIds = new Set();
      const allMeals = [...child.breakfast, ...child.lunch, ...child.dinner];
      
      for (const meal of allMeals) {
        if (usedIds.has(meal._id.toString())) {
          return createIndividualImproved(); // Recreate if duplicate
        }
        usedIds.add(meal._id.toString());
      }

      return child;
    }

    // Mutation cải tiến - cao hơn và thông minh hơn
    function mutateImproved(individual) {
      const ind = JSON.parse(JSON.stringify(individual));
      const allUsed = new Set([...ind.breakfast, ...ind.lunch, ...ind.dinner]
        .map(m => m._id.toString()));

      // Mutate breakfast với xác suất cao hơn
      if (Math.random() < mutationRate) {
        ind.breakfast.forEach(m => allUsed.delete(m._id.toString()));
        ind.breakfast = pickBreakfastImproved(allUsed);
        ind.breakfast.forEach(m => allUsed.add(m._id.toString()));
      }

      // Mutate lunch
      if (Math.random() < mutationRate) {
        ind.lunch.forEach(m => allUsed.delete(m._id.toString()));
        ind.lunch = pickLunch(allUsed);
        ind.lunch.forEach(m => allUsed.add(m._id.toString()));
      }

      // Mutate dinner
      if (Math.random() < mutationRate) {
        ind.dinner.forEach(m => allUsed.delete(m._id.toString()));
        ind.dinner = pickDinner(allUsed);
        ind.dinner.forEach(m => allUsed.add(m._id.toString()));
      }

      // Random swap giữa các bữa (thêm đa dạng)
      if (Math.random() < 0.1) {
        const temp = ind.lunch;
        ind.lunch = ind.dinner;
        ind.dinner = temp;
      }

      if (!isValidImproved(ind)) {
        return createIndividualImproved();
      }

      return ind;
    }

    // Khởi tạo population
    let population = Array.from({ length: populationSize }, createIndividualImproved);

    // Evolution loop
    for (let gen = 0; gen < generations; gen++) {
      const selected = selectionWithElitism(population);
      
      if (selected.length === 0) {
        console.warn(`Generation ${gen}: No valid individuals`);
        continue;
      }

      const newPopulation = [...selected.slice(0, eliteSize)]; // Keep elite

      // Create offspring
      while (newPopulation.length < populationSize) {
        const p1 = selected[Math.floor(Math.random() * selected.length)];
        const p2 = selected[Math.floor(Math.random() * selected.length)];
        
        let child = crossoverImproved(p1, p2);
        child = mutateImproved(child);
        
        newPopulation.push(child);
      }

      population = newPopulation;

      // Log progress
      if (gen % 20 === 0) {
        const best = selected[0];
        const bestCal = [...best.breakfast, ...best.lunch, ...best.dinner]
          .reduce((s, m) => s + (m.calories || 0), 0);
        console.log(`Gen ${gen}: Best fitness = ${fitnessImproved(best).toFixed(0)}, Calories = ${bestCal}`);
      }
    }

    // Return best solution
    const finalSelection = selectionWithElitism(population);
    return finalSelection.length > 0 ? finalSelection[0] : { breakfast: [], lunch: [], dinner: [] };
  }

  const bestMeal = runImprovedGA(filteredMeals, targetCaloriesPerDay, dislikes);
  
  if (!bestMeal || !bestMeal.breakfast || bestMeal.breakfast.length === 0) {
    return res.status(500).json({ error: 'Không thể tìm thấy thực đơn phù hợp' });
  }

  const selectedCalories = [...bestMeal.breakfast, ...bestMeal.lunch, ...bestMeal.dinner]
    .reduce((sum, m) => sum + (m.calories || 0), 0);

  res.json({
    targetCaloriesPerDay,
    selectedCalories: Math.round(selectedCalories),
    goal,
    bmi: bmi.toFixed(2),
    meals: [
      {
        meal: 'Bữa sáng',
        targetCalories: null,
        details: bestMeal.breakfast
      },
      {
        meal: 'Bữa chiều',
        targetCalories: null,
        details: bestMeal.lunch
      },
      {
        meal: 'Bữa tối',
        targetCalories: null,
        details: bestMeal.dinner
      },
    ]
  });
});

// ======================================================
// ============== API ĐĂNG KÝ / ĐĂNG NHẬP ===============
// ======================================================

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Password complexity validation
  if (password.length < 8) {
    return res.status(400).json({ error: 'Mật khẩu phải dài ít nhất 8 ký tự.' });
  }
  if (!/[a-z]/.test(password)) {
    return res.status(400).json({ error: 'Mật khẩu phải chứa ít nhất 1 chữ thường (a-z).' });
  }
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ error: 'Mật khẩu phải chứa ít nhất 1 chữ hoa (A-Z).' });
  }
  if (!/\d/.test(password)) {
    return res.status(400).json({ error: 'Mật khẩu phải chứa ít nhất 1 chữ số (0-9).' });
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return res.status(400).json({ error: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (ví dụ: @, #, $, ...).' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';
    const user = await User.create({ email, password: hashedPassword, role });
    res.status(201).json({ 
      message: 'Registration successful', 
      user: { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        latestPlannerProfile: user.latestPlannerProfile
      } 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    res.json({ 
      message: 'Login successful', 
      user: { 
        userId: user._id, 
        email: user.email, 
        role: user.role || 'user',
        latestPlannerProfile: user.latestPlannerProfile || {}
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Cập nhật Profile của User
app.put('/users/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const { weight, height, age, gender, activity_level, dislikedGroups, dislikedIngredients, dislikedMeals } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        latestPlannerProfile: {
          weight: String(weight || ''),
          height: String(height || ''),
          age: String(age || ''),
          gender: String(gender || ''),
          activity_level: String(activity_level || ''),
          dislikedGroups: String(dislikedGroups || ''),
          dislikedIngredients: String(dislikedIngredients || ''),
          dislikedMeals: String(dislikedMeals || '')
        }
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        userId: user._id,
        email: user.email,
        role: user.role,
        latestPlannerProfile: user.latestPlannerProfile
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Lấy lịch sử Menu gia đình của User
app.get('/family/menu/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const results = await FamilyMenuResult.find({ userId }).sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    console.error('Error fetching family menus for user:', err);
    res.status(500).json({ error: 'Server error while fetching family menus' });
  }
});

// Admin Overview Dashboard API
app.get('/admin/overview', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    const registeredUsersCount = users.length;
    const mealCount = await Meal.countDocuments();
    const ingredientCount = await Ingredient.countDocuments();
    
    res.json({
      users: users.map(u => ({
        userId: u._id,
        email: u.email,
        role: u.role,
        latestPlannerProfile: u.latestPlannerProfile
      })),
      registeredUsersCount,
      mealCount,
      ingredientCount
    });
  } catch (err) {
    console.error('Error getting admin overview:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ======================================================
// ================== API DANH SÁCH MÓN =================
// ======================================================

app.get('/meals', async (req, res) => {
    try {
        const allMeals = await Meal.find({});
        res.status(200).json(allMeals);
    } catch (error) {
        console.error('Error fetching meals:', error);
        res.status(500).json({ error: 'Failed to fetch meals list' });
    }
});

// CRUD cho Meals
app.post('/meals', async (req, res) => {
    try {
        const newMeal = await Meal.create(req.body);
        res.status(201).json({ meal: newMeal, message: 'Meal created successfully' });
    } catch (err) {
        console.error('Error creating meal:', err);
        res.status(500).json({ error: 'Server error while creating meal' });
    }
});

app.put('/meals/:mealId', async (req, res) => {
    try {
        const { mealId } = req.params;
        const updatedMeal = await Meal.findByIdAndUpdate(mealId, req.body, { new: true });
        if (!updatedMeal) {
            return res.status(404).json({ error: 'Meal not found' });
        }
        res.json({ meal: updatedMeal, message: 'Meal updated successfully' });
    } catch (err) {
        console.error('Error updating meal:', err);
        res.status(500).json({ error: 'Server error while updating meal' });
    }
});

app.delete('/meals/:mealId', async (req, res) => {
    try {
        const { mealId } = req.params;
        const deletedMeal = await Meal.findByIdAndDelete(mealId);
        if (!deletedMeal) {
            return res.status(404).json({ error: 'Meal not found' });
        }
        res.json({ message: 'Meal deleted successfully' });
    } catch (err) {
        console.error('Error deleting meal:', err);
        res.status(500).json({ error: 'Server error while deleting meal' });
    }
});

// ======================================================
// ============= API LỊCH SỬ MÓN ĂN THEO NGÀY ===========
// ======================================================

app.post('/meal-history', async (req, res) => {
    try {
        const { userId, day, meals } = req.body;

        if (!userId || !day || !meals || !Array.isArray(meals)) {
            return res.status(400).json({ error: 'userId, day, and meals array are required' });
        }

        let normalizedDay = day.toLowerCase().trim();
        const dayMap = {
            'thứ hai': 'monday', 'thu hai': 'monday', 't2': 'monday', 'monday': 'monday',
            'thứ ba': 'tuesday', 'thu ba': 'tuesday', 't3': 'tuesday', 'tuesday': 'tuesday',
            'thứ tư': 'wednesday', 'thu tu': 'wednesday', 't4': 'wednesday', 'wednesday': 'wednesday',
            'thứ năm': 'thursday', 'thu nam': 'thursday', 't5': 'thursday', 'thursday': 'thursday',
            'thứ sáu': 'friday', 'thu sau': 'friday', 't6': 'friday', 'friday': 'friday',
            'thứ bảy': 'saturday', 'thu bay': 'saturday', 't7': 'saturday', 'saturday': 'saturday',
            'chủ nhật': 'sunday', 'chu nhat': 'sunday', 'cn': 'sunday', 'sunday': 'sunday'
        };
        if (dayMap[normalizedDay]) {
            normalizedDay = dayMap[normalizedDay];
        }

        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        if (!validDays.includes(normalizedDay)) {
            return res.status(400).json({ error: 'Invalid day. Must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday' });
        }

        const mealTypeMap = {
            'breakfast': 'breakfast', 'bữa sáng': 'breakfast', 'bua sang': 'breakfast',
            'lunch': 'lunch', 'bữa trưa': 'lunch', 'bua trua': 'lunch', 'bữa chiều': 'lunch', 'bua chieu': 'lunch',
            'dinner': 'dinner', 'bữa tối': 'dinner', 'bua toi': 'dinner'
        };

        const mealsWithIngredients = meals.map(meal => {
            let normalizedMealType = (meal.mealType || '').toLowerCase().trim();
            if (mealTypeMap[normalizedMealType]) {
                normalizedMealType = mealTypeMap[normalizedMealType];
            } else {
                normalizedMealType = 'breakfast';
            }

            return {
                mealId: meal.mealId,
                mealName: meal.mealName,
                mealType: normalizedMealType,
                ingredients: meal.ingredients || [],
                calories: meal.calories || 0,
                protein: meal.protein || 0,
                fat: meal.fat || 0,
                carbs: meal.carbs || 0,
                image_url: meal.image_url || null
            };
        });

        let mealHistory = await MealHistory.findOne({ userId, day: normalizedDay });

        if (mealHistory) {
            mealHistory.meals = mealsWithIngredients;
            mealHistory.dateAdded = new Date();
        } else {
            mealHistory = new MealHistory({
                userId,
                day: normalizedDay,
                meals: mealsWithIngredients
            });
        }

        await mealHistory.save();
        res.status(200).json({ message: 'Meal history saved successfully', mealHistory });
    } catch (error) {
        console.error('Error saving meal history:', error);
        res.status(500).json({ error: 'Failed to save meal history: ' + error.message });
    }
});

app.get('/meal-history/:userId/:day', async (req, res) => {
    try {
        const { userId, day } = req.params;

        let normalizedDay = day.toLowerCase().trim();
        const dayMap = {
            'thứ hai': 'monday', 'thu hai': 'monday', 't2': 'monday', 'monday': 'monday',
            'thứ ba': 'tuesday', 'thu ba': 'tuesday', 't3': 'tuesday', 'tuesday': 'tuesday',
            'thứ tư': 'wednesday', 'thu tu': 'wednesday', 't4': 'wednesday', 'wednesday': 'wednesday',
            'thứ năm': 'thursday', 'thu nam': 'thursday', 't5': 'thursday', 'thursday': 'thursday',
            'thứ sáu': 'friday', 'thu sau': 'friday', 't6': 'friday', 'friday': 'friday',
            'thứ bảy': 'saturday', 'thu bay': 'saturday', 't7': 'saturday', 'saturday': 'saturday',
            'chủ nhật': 'sunday', 'chu nhat': 'sunday', 'cn': 'sunday', 'sunday': 'sunday'
        };
        if (dayMap[normalizedDay]) {
            normalizedDay = dayMap[normalizedDay];
        }

        const mealHistory = await MealHistory.findOne({ 
            userId, 
            day: normalizedDay 
        }).populate('meals.mealId');

        if (!mealHistory) {
            return res.status(404).json({ error: 'No meal history found for this day' });
        }

        res.status(200).json(mealHistory);
    } catch (error) {
        console.error('Error fetching meal history:', error);
        res.status(500).json({ error: 'Failed to fetch meal history: ' + error.message });
    }
});

app.get('/meal-history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const mealHistories = await MealHistory.find({ userId })
          .populate('meals.mealId')
          .sort({ day: 1 });

        res.status(200).json(mealHistories);
    } catch (error) {
        console.error('Error fetching meal histories:', error);
        res.status(500).json({ error: 'Failed to fetch meal histories: ' + error.message });
    }
});

// ======================================================
// ======= HELPER CHUNG: PARSE + TÍNH GIÁ NGUYÊN LIỆU ====
// ======================================================

// Parse chuỗi "50g yến mạch", "200ml sữa", "1 quả trứng"...
function parseIngredientString(ingredientStr) {
    const normalized = ingredientStr.toLowerCase().trim();
    const match = normalized.match(
        /^(\d+)\s*(g|gram|gr|kg|ml|l|lít|quả|trứng|bó|gói|hộp|lọ|trái)?\s*(.+)?$/i
    );

    let amount = null;
    let amountUnit = null;
    let namePart = normalized;

    if (match) {
        amount = parseInt(match[1], 10);
        amountUnit = (match[2] || '').toLowerCase().trim();
        namePart = (match[3] || '').trim();
    }

    return { original: ingredientStr, normalized, amount, amountUnit, namePart };
}

// Hàm tính giá theo khẩu phần sử dụng
function computePortionPrice(ingredient, amount, amountUnit) {
    if (!ingredient) return 0;
    const price = ingredient.price || 0;
    const dbUnit = (ingredient.unit || '').toLowerCase();
    const amt = amount || 0;
    let unit = (amountUnit || '').toLowerCase();

    // Chuẩn hóa gr/gram -> g
    if (unit === 'gr' || unit === 'gram') unit = 'g';

    // Nếu không parse được thì tạm tính cả đơn vị (1 gói, 1 hộp, 1 kg, ...)
    if (!amt && !unit) return price;

    // 1. KG / G
    if (dbUnit === 'kg') {
        if (unit === 'g')   return price * (amt / 1000);
        if (unit === 'kg')  return price * amt;
    }

    // 2. 100g
    if (dbUnit === '100g') {
        if (unit === 'g')    return price * (amt / 100);
        if (unit === '100g') return price * amt;
    }

    // 3. LÍT / ML
    if (dbUnit === 'lít' || dbUnit === 'lit' || dbUnit === 'l') {
        if (unit === 'ml')             return price * (amt / 1000);
        if (unit === 'l' || unit === 'lít') return price * amt;
    }

    // 4. VỈ 10 TRỨNG
    if (dbUnit === 'vỉ 10') {
        if (unit === 'quả' || unit === 'trứng') {
            return price * (amt / 10);
        }
        if (unit === 'vỉ') {
            return price * amt;
        }
    }

    // 5. BÓ / HỘP / LỌ / TRÁI / GÓI
    if (dbUnit === 'bó' && (!unit || unit === 'bó'))   return price * (amt || 1);
    if (dbUnit === 'hộp' && (!unit || unit === 'hộp')) return price * (amt || 1);
    if (dbUnit === 'lọ' && (!unit || unit === 'lọ'))   return price * (amt || 1);
    if ((dbUnit === 'trái' || dbUnit === 'quả') && (!unit || unit === 'trái' || unit === 'quả')) {
        return price * (amt || 1);
    }
    if (dbUnit === 'gói' && (!unit || unit === 'gói')) return price * (amt || 1);

    // Không match được → tạm tính nguyên giá
    return price;
}

// ======================================================
// =========== API NGUYÊN LIỆU VÀ GIÁ THEO NGÀY =========
// ======================================================

app.get('/ingredients/:userId/:day', async (req, res) => {
    try {
        const { userId, day } = req.params;
        
        let normalizedDay = day.toLowerCase().trim();
        const dayMap = {
            'thứ hai': 'monday', 'thu hai': 'monday', 't2': 'monday', 'monday': 'monday',
            'thứ ba': 'tuesday', 'thu ba': 'tuesday', 't3': 'tuesday', 'tuesday': 'tuesday',
            'thứ tư': 'wednesday', 'thu tu': 'wednesday', 't4': 'wednesday', 'wednesday': 'wednesday',
            'thứ năm': 'thursday', 'thu nam': 'thursday', 't5': 'thursday', 'thursday': 'thursday',
            'thứ sáu': 'friday', 'thu sau': 'friday', 't6': 'friday', 'friday': 'friday',
            'thứ bảy': 'saturday', 'thu bay': 'saturday', 't7': 'saturday', 'saturday': 'saturday',
            'chủ nhật': 'sunday', 'chu nhat': 'sunday', 'cn': 'sunday', 'sunday': 'sunday'
        };
        if (dayMap[normalizedDay]) {
            normalizedDay = dayMap[normalizedDay];
        }

        console.log(`🔍 Đang tìm ingredients cho userId: ${userId}, day: ${normalizedDay}`);

        const mealHistory = await MealHistory.findOne({ 
            userId, 
            day: normalizedDay 
        });

        if (!mealHistory || !mealHistory.meals || mealHistory.meals.length === 0) {
            console.log(`⚠️ Không tìm thấy meal history cho ${normalizedDay}`);
            return res.status(404).json({ error: 'No meals found for this day' });
        }

        console.log(`✅ Tìm thấy ${mealHistory.meals.length} món ăn cho ${normalizedDay}`);

        const allIngredients = new Map();

        mealHistory.meals.forEach(meal => {
            console.log(`  - Món: ${meal.mealName}, Ingredients: ${meal.ingredients?.length || 0}`);
            
            if (meal.ingredients && Array.isArray(meal.ingredients)) {
                meal.ingredients.forEach(ingredientStr => {
                    const parsed = parseIngredientString(ingredientStr);

                    if (!allIngredients.has(parsed.normalized)) {
                        allIngredients.set(parsed.normalized, {
                            ...parsed,
                            mealName: meal.mealName,
                            mealType: meal.mealType
                        });
                    }
                });
            }
        });

        console.log(`📋 Tổng số nguyên liệu unique: ${allIngredients.size}`);

        const ingredientsWithInfo = [];

        for (const [normalized, info] of allIngredients) {
            let cleanedName = (info.namePart || normalized)
                .toLowerCase()
                .trim();

            cleanedName = cleanedName
                .replace(/^\d+\s*(g|gram|gr|kg|ml|l|lít)\s*/i, '')
                .replace(/^1\s*quả\s*/i, '')
                .trim();

            const ingredient = await Ingredient.findOne({
                name: { $regex: cleanedName, $options: 'i' }
            });

            console.log(
                `  ${info.original} -> search "${cleanedName}" -> ${ingredient ? '✅ Có giá' : '❌ Không có giá'}`
            );

            const portionPrice = computePortionPrice(
                ingredient,
                info.amount,
                info.amountUnit
            );

            ingredientsWithInfo.push({
                name: info.original,
                normalized,
                amount: info.amount,
                amountUnit: info.amountUnit,
                price: portionPrice,
                unit: ingredient ? ingredient.unit : null,
                image_url: ingredient ? ingredient.image_url : null,
                category: ingredient ? ingredient.category : null,
                mealName: info.mealName,
                mealType: info.mealType
            });
        }

        const totalPrice = ingredientsWithInfo.reduce(
            (sum, ing) => sum + (ing.price || 0),
            0
        );

        console.log(`💰 Tổng giá: ${totalPrice} VNĐ`);

        res.status(200).json({
            day: day.toLowerCase(),
            ingredients: ingredientsWithInfo,
            totalPrice: totalPrice
        });
    } catch (error) {
        console.error('❌ Error fetching ingredients:', error);
        res.status(500).json({ error: 'Failed to fetch ingredients: ' + error.message });
    }
});

// Thêm/Cập nhật nguyên liệu
app.post('/ingredients', async (req, res) => {
    try {
        const { name, price, unit, image_url, category } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Ingredient name is required' });
        }

        const ingredient = await Ingredient.findOneAndUpdate(
            { name: name.toLowerCase() },
            { 
                name: name.toLowerCase(),
                price: price || 0,
                unit: unit || 'kg',
                image_url: image_url || null,
                category: category || null
            },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: 'Ingredient saved successfully', ingredient });
    } catch (error) {
        console.error('Error saving ingredient:', error);
        res.status(500).json({ error: 'Failed to save ingredient: ' + error.message });
    }
});

// Lấy tất cả nguyên liệu
app.get('/ingredients', async (req, res) => {
    try {
        const ingredients = await Ingredient.find().sort({ name: 1 });
        res.status(200).json(ingredients);
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        res.status(500).json({ error: 'Failed to fetch ingredients: ' + error.message });
    }
});

// ======================================================
// =============== FAMILY BUDGET / MENU 7 NGÀY ==========
// ======================================================

// Helper: tìm Ingredient trong list đã load
function findIngredientFromList(cleanedName, ingredientList) {
    if (!cleanedName) return null;
    const key = cleanedName.toLowerCase();

    return (
        ingredientList.find(ing => key.includes(ing.name.toLowerCase())) ||
        ingredientList.find(ing => ing.name.toLowerCase().includes(key)) ||
        null
    );
}

// Tính giá 1 món (Meal) cho 1 khẩu phần
async function calcMealCost(meal, ingredientList) {
    if (!meal.ingredients || !Array.isArray(meal.ingredients)) return 0;

    let total = 0;

    for (const ingStr of meal.ingredients) {
        const parsed = parseIngredientString(ingStr);

        let cleanedName = (parsed.namePart || parsed.normalized)
            .replace(/^\d+\s*(g|gram|gr|kg|ml|l|lít)\s*/i, '')
            .replace(/^1\s*quả\s*/i, '')
            .trim();

        if (!cleanedName) continue;

        const ing = findIngredientFromList(cleanedName, ingredientList);

        const portionPrice = computePortionPrice(
            ing,
            parsed.amount,
            parsed.amountUnit
        );

        total += portionPrice;
    }

    return total;
}
app.get('/meals/:mealId/ingredient-costs', async (req, res) => {
    try {
        const { mealId } = req.params;

        const meal = await Meal.findById(mealId).lean();
        if (!meal) {
            return res.status(404).json({ message: 'Meal not found' });
        }

        const ingredients = await Ingredient.find().lean();
        const ingredientList = ingredients.map(ing => ({
            ...ing,
            name: (ing.name || '').toLowerCase()
        }));

        let totalCost = 0;
        const detail = [];

        if (meal.ingredients && Array.isArray(meal.ingredients)) {
            for (const ingStr of meal.ingredients) {
                const parsed = parseIngredientString(ingStr);

                let cleanedName = (parsed.namePart || parsed.normalized)
                    .replace(/^\d+\s*(g|gram|gr|kg|ml|l|lít)\s*/i, '')
                    .replace(/^1\s*quả\s*/i, '')
                    .trim();

                if (!cleanedName) continue;

                const ing = findIngredientFromList(cleanedName, ingredientList);
                const price = computePortionPrice(
                    ing,
                    parsed.amount,
                    parsed.amountUnit
                );

                totalCost += price;

                detail.push({
                    original: ingStr,
                    amount: parsed.amount,
                    amountUnit: parsed.amountUnit,
                    matchedIngredient: ing ? ing.name : null,
                    unit: ing ? ing.unit : null,
                    price: price
                });
            }
        }

        return res.json({
            mealId: meal._id,
            name: meal.name,
            calories: meal.calories || 0,
            group: meal.group,
            totalCostPerPerson: Math.round(totalCost),
            ingredients: detail
        });
    } catch (err) {
        console.error('Error /meals/:mealId/ingredient-costs:', err);
        return res
            .status(500)
            .json({ message: 'Lỗi server khi lấy chi tiết nguyên liệu.' });
    }
});
// GET /family/min-cost
// Chi phí tối thiểu / 1 người / tuần = 3 bữa/ngày × 7 ngày + buffer 50k
app.get('/family/min-cost', async (req, res) => {
    try {
        const meals = await Meal.find().lean();
        const ingredients = await Ingredient.find().lean();

        if (!meals.length || !ingredients.length) {
            return res
                .status(400)
                .json({ message: 'Thiếu dữ liệu món ăn hoặc nguyên liệu.' });
        }

        const ingredientList = ingredients.map(ing => ({
            ...ing,
            name: (ing.name || '').toLowerCase()
        }));

        const mealCosts = [];
        for (const meal of meals) {
            const cost = await calcMealCost(meal, ingredientList);
            if (cost > 0) {
                mealCosts.push({ meal, cost });
            }
        }

        if (mealCosts.length < 3) {
            return res
                .status(400)
                .json({ message: 'Không đủ món có thể tính được giá.' });
        }

        mealCosts.sort((a, b) => a.cost - b.cost);
        const cheapest3 = mealCosts.slice(0, 3);

        const dailyCostPerPerson = cheapest3.reduce(
            (sum, m) => sum + (m.cost || 0),
            0
        );
        const baseWeeklyCostPerPerson = dailyCostPerPerson * 7;
        const buffer = 50000;
        const weeklyCostPerPerson = baseWeeklyCostPerPerson + buffer;

        return res.json({
            minCostPerPerson: Math.round(weeklyCostPerPerson),
            baseWeeklyCostPerPerson: Math.round(baseWeeklyCostPerPerson),
            buffer,
            dailyCostPerPerson: Math.round(dailyCostPerPerson),
            cheapestMeals: cheapest3.map(m => ({
                name: m.meal.name,
                cost: Math.round(m.cost || 0)
            })),
            note:
                'Ước tính 3 bữa/ngày × 7 ngày, chọn 3 món rẻ nhất từ danh sách Meal, dựa trên giá nguyên liệu. Cộng thêm 50.000đ buffer để linh động đổi món.'
        });
    } catch (err) {
        console.error('Error /family/min-cost:', err);
        return res
            .status(500)
            .json({ message: 'Lỗi server khi tính chi phí tối thiểu.' });
    }
});

// POST /family/menu & /family/generate-menu
// Body: { familySize, weeklyBudget }
async function generateFamilyMenuHandler(req, res) {
    try {
        const { familySize, weeklyBudget, userId } = req.body;

        if (!familySize || !weeklyBudget) {
            return res
                .status(400)
                .json({ message: 'Thiếu familySize hoặc weeklyBudget.' });
        }

        const meals = await Meal.find().lean();
        const ingredients = await Ingredient.find().lean();
        

        if (!meals.length || !ingredients.length) {
            return res
                .status(400)
                .json({ message: 'Thiếu dữ liệu món ăn hoặc nguyên liệu.' });
        }

        const ingredientList = ingredients.map(ing => ({
            ...ing,
            name: (ing.name || '').toLowerCase()
        }));

        // Tính cost cho từng món
        const mealCosts = [];
        for (const meal of meals) {
            const cost = await calcMealCost(meal, ingredientList);
            if (cost > 0) {
                mealCosts.push({ meal, cost });
            }
        }

        if (mealCosts.length < 3) {
            return res
                .status(500)
                .json({ message: 'Không đủ món ăn để tạo menu.' });
        }

        // ❌ KHÔNG dùng rau củ làm món chính (Su su luộc, bông cải xào... )
        const mainMealCosts = mealCosts.filter(mc => mc.meal.group !== 'rau củ ' && mc.meal.group !== 'trái cây');
        if (mainMealCosts.length < 3) {
            return res
                .status(500)
                .json({ message: 'Không đủ món chính (không tính rau củ) để tạo menu.' });
        }
        

        

        // sort theo giá từ rẻ tới mắc
        mainMealCosts.sort((a, b) => a.cost - b.cost);

        // 3 món rẻ nhất để tính MIN budget lý thuyết
        const [cheapestBreakfast, cheapestLunch, cheapestDinner] = mainMealCosts;

        const minCostPerPersonPerDay =
            (cheapestBreakfast.cost || 0) +
            (cheapestLunch.cost || 0) +
            (cheapestDinner.cost || 0);
        

        const minCostPerFamilyPerDay = minCostPerPersonPerDay * familySize;
        const baseWeekCostMin = minCostPerFamilyPerDay * 7;
        const buffer = 50000;
        const minTotalWeekCost = baseWeekCostMin + buffer;
        const fruitMealCosts = mealCosts.filter(mc => mc.meal.group === 'trái cây');

        // Nếu ngay cả combo rẻ nhất còn không đủ ngân sách => báo lỗi
        if (weeklyBudget < minTotalWeekCost) {
            return res.status(400).json({
                message: `Ngân sách không đủ. Tối thiểu khoảng ${Math.round(
                    minTotalWeekCost
                )}đ / tuần cho ${familySize} người (đã cộng buffer 50.000đ).`,
                minBudget: Math.round(minTotalWeekCost)
            });
        }

        // ---------- RANDOM MENU CHO TỪNG NGÀY TRONG NGÂN SÁCH ----------
        const weekdays = [
            'Thứ 2',
            'Thứ 3',
            'Thứ 4',
            'Thứ 5',
            'Thứ 6',
            'Thứ 7',
            'Chủ nhật'
        ];

        // ngân sách tối đa cho 1 ngày / cả gia đình (trừ buffer)
        const maxBudgetPerFamilyPerDay = (weeklyBudget - buffer) / 7;
        const maxBudgetPerPersonPerDay = maxBudgetPerFamilyPerDay / familySize;

        // Hàm random 3 món cho 1 ngày, cố gắng <= maxBudgetPerPersonPerDay
        function pickMealsForOneDay(costList, maxPerPersonDay) {
            if (costList.length < 3) {
                return [cheapestBreakfast, cheapestLunch, cheapestDinner];
            }

            const maxTries = 100;
            let bestCombo = [cheapestBreakfast, cheapestLunch, cheapestDinner];
            let bestCost = minCostPerPersonPerDay; // cost của combo rẻ nhất

            for (let t = 0; t < maxTries; t++) {
                // random 3 index khác nhau
                const idx1 = Math.floor(Math.random() * costList.length);
                let idx2 = Math.floor(Math.random() * costList.length);
                let idx3 = Math.floor(Math.random() * costList.length);
                if (idx2 === idx1) idx2 = (idx2 + 1) % costList.length;
                if (idx3 === idx1 || idx3 === idx2) {
                    idx3 = (idx3 + 2) % costList.length;
                }

                const c1 = costList[idx1];
                const c2 = costList[idx2];
                const c3 = costList[idx3];

                const total = (c1.cost || 0) + (c2.cost || 0) + (c3.cost || 0);

                // lưu combo tốt nhất nhưng không vượt budget
                if (total <= maxPerPersonDay && total >= bestCost) {
                    bestCombo = [c1, c2, c3];
                    bestCost = total;
                }
            }

            return bestCombo;
        }
        function pickOneFruit(fruitList) {
    if (!fruitList || fruitList.length === 0) return null;

    // ưu tiên trái cây rẻ
    const sorted = [...fruitList].sort((a, b) => a.cost - b.cost);

    // random trong top 5 trái cây rẻ nhất
    const limit = Math.min(5, sorted.length);
    return sorted[Math.floor(Math.random() * limit)];
}

        const days = weekdays.map(dayVi => {
    const [bCost, lCost, dCost] = pickMealsForOneDay(
        mainMealCosts,
        maxBudgetPerPersonPerDay
    );

    // 🍎 chọn 1 trái cây
    const fruit = pickOneFruit(fruitMealCosts);
    const fruitMealType = Math.random() > 0.5 ? 'Bữa trưa' : 'Bữa tối';

    const costPerPersonPerDay =
        (bCost.cost || 0) +
        (lCost.cost || 0) +
        (dCost.cost || 0) +
        (fruit?.cost || 0);

    const costPerFamilyPerDay = costPerPersonPerDay * familySize;

    const ingredientCount =
        (bCost.meal.ingredients?.length || 0) +
        (lCost.meal.ingredients?.length || 0) +
        (dCost.meal.ingredients?.length || 0) +
        (fruit?.meal.ingredients?.length || 0);

    const meals = [
        {
            mealTypeVi: 'Bữa sáng',
            dish: {
                mealId: bCost.meal._id,
                name: bCost.meal.name,
                calories: bCost.meal.calories || 0,
                pricePerPerson: Math.round(bCost.cost || 0)
            }
        },
        {
            mealTypeVi: 'Bữa trưa',
            dish: {
                mealId: lCost.meal._id,
                name: lCost.meal.name,
                calories: lCost.meal.calories || 0,
                pricePerPerson: Math.round(lCost.cost || 0)
            }
        },
        {
            mealTypeVi: 'Bữa tối',
            dish: {
                mealId: dCost.meal._id,
                name: dCost.meal.name,
                calories: dCost.meal.calories || 0,
                pricePerPerson: Math.round(dCost.cost || 0)
            }
        }
    ];

    // 🍎 gắn trái cây vào trưa hoặc tối
    if (fruit) {
        meals.push({
            mealTypeVi: fruitMealType,
            dish: {
                mealId: fruit.meal._id,
                name: fruit.meal.name,
                calories: fruit.meal.calories || 0,
                pricePerPerson: Math.round(fruit.cost || 0),
                isFruit: true
            }
        });
    }

    return {
        dayKeyVi: dayVi,
        ingredientCount,
        totalCost: Math.round(costPerFamilyPerDay),
        meals
    };
});

        const totalWeekCost = days.reduce(
            (sum, d) => sum + (d.totalCost || 0),
            0
        ) + buffer;

        const baseWeekCost = totalWeekCost - buffer;
        const minBudgetPerPerson = Math.round(minTotalWeekCost / familySize);
        const minBudgetForFamily = Math.round(minTotalWeekCost);

        // ---------- LƯU KẾT QUẢ VÀO DATABASE ----------
        const saved = await FamilyMenuResult.create({
            userId,
            familySize,
            weeklyBudget,
            minBudgetPerPerson,
            minBudgetForFamily,
            isBudgetEnough: true,
            baseWeekCost: Math.round(baseWeekCost),
            buffer,
            totalWeekCost: Math.round(totalWeekCost),
            days
        });

        // ---------- TRẢ VỀ CHO APP ----------
        return res.json({
            isBudgetEnough: true,
            totalWeekCost: Math.round(totalWeekCost),
            baseWeekCost: Math.round(baseWeekCost),
            buffer,
            familySize,
            days,
            minBudgetPerPerson,
            minBudgetForFamily,
            savedId: saved._id
        });
    } catch (err) {
        console.error('Error /family/menu:', err);
        return res
            .status(500)
            .json({ message: 'Lỗi server khi tạo menu gia đình.' });
    }
}

app.post('/family/menu', generateFamilyMenuHandler);
app.post('/family/generate-menu', generateFamilyMenuHandler);
// ======================================================
// ================== KHỞI ĐỘNG SERVER ==================
// ======================================================

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, "0.0.0.0", () => console.log("Server running"));
}
module.exports = app;
