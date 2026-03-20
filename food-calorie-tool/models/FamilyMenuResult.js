// models/FamilyMenuResult.js
const mongoose = require('mongoose');

const DaySchema = new mongoose.Schema({
  dayKeyVi: String,              // "Thứ 2", "Thứ 3", ...
  ingredientCount: Number,
  totalCost: Number,             // tổng tiền 1 ngày cho cả gia đình
  meals: [mongoose.Schema.Types.Mixed], // giữ nguyên cấu trúc bạn đang trả về
});

const FamilyMenuResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  familySize: Number,            // số người
  weeklyBudget: Number,          // ngân sách user nhập

  // budget tối thiểu (theo combo rẻ nhất)
  minBudgetPerPerson: Number,    // tiền tối thiểu 1 người / tuần
  minBudgetForFamily: Number,    // tiền tối thiểu X người / tuần

  isBudgetEnough: Boolean,       // ngân sách đủ hay không

  baseWeekCost: Number,          // tổng tiền menu sinh ra (chưa buffer)
  buffer: Number,                // buffer 50k
  totalWeekCost: Number,         // baseWeekCost + buffer

  days: [DaySchema],             // menu 7 ngày
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FamilyMenuResult', FamilyMenuResultSchema);
