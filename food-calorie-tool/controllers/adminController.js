const FamilyMenuResult = require('../models/FamilyMenuResult');
const MealHistory = require('../models/MealHistory');
const User = require('../models/User');

async function getAdminUsersOverview(req, res) {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 }).lean();
    const userIds = users.map((user) => user._id);
    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const histories = await MealHistory.find({
      userId: { $in: userIds },
      day: { $in: weekDays },
    }).lean();

    const familyMenus = await FamilyMenuResult.find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .lean();

    const historyMap = new Map();
    histories.forEach((history) => {
      historyMap.set(`${history.userId}-${history.day}`, history);
    });

    const familyMenuMap = new Map();
    familyMenus.forEach((menu) => {
      const key = String(menu.userId);
      if (!familyMenuMap.has(key)) {
        familyMenuMap.set(key, menu);
      }
    });

    const summaries = users.map((user) => {
      const familyMenu = familyMenuMap.get(String(user._id));
      const weekMeals = weekDays.reduce((accumulator, day) => {
        const history = historyMap.get(`${user._id}-${day}`);
        accumulator[day] = history?.meals?.map((meal) => meal.mealName) || [];
        return accumulator;
      }, {});

      return {
        userId: user._id,
        email: user.email,
        createdAt: user.createdAt,
        bmi: user.latestPlannerProfile?.bmi || null,
        weekMeals,
        hasFamilyMenu: Boolean(familyMenu),
      };
    });

    return res.json({
      registeredUsersCount: users.length,
      users: summaries,
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin overview: ' + error.message });
  }
}

module.exports = {
  getAdminUsersOverview,
};
