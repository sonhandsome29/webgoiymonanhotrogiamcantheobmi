const mongoose = require('mongoose');
const Ingredient = require('./models/Ingredient');

const ingredientsData = [
  { name: 'ức gà', price: 85000, unit: 'kg', category: 'thịt', image_url: '/images/ingredients/uc_ga.jpg' },
  { name: 'đùi gà', price: 75000, unit: 'kg', category: 'thịt', image_url: '/images/ingredients/dui_ga.jpg' },
  { name: 'nạc heo', price: 120000, unit: 'kg', category: 'thịt', image_url: '/images/ingredients/nac_heo.jpg' },
  { name: 'thịt heo băm', price: 110000, unit: 'kg', category: 'thịt', image_url: '/images/ingredients/thit_heo_bam.jpg' },
  { name: 'thịt bò', price: 250000, unit: 'kg', category: 'thịt', image_url: '/images/ingredients/bo_than.jpg' },
  { name: 'sườn', price: 135000, unit: 'kg', category: 'thịt', image_url: '/images/ingredients/suon.jpg' },
  { name: 'cá hồi', price: 350000, unit: 'kg', category: 'hải sản', image_url: '/images/ingredients/ca_hoi.jpg' },
  { name: 'cá lóc', price: 95000, unit: 'kg', category: 'hải sản', image_url: '/images/ingredients/ca_loc.jpg' },
  { name: 'cá thu', price: 85000, unit: 'kg', category: 'hải sản', image_url: '/images/ingredients/ca_thu.jpg' },
  { name: 'cá ngừ', price: 150000, unit: 'kg', category: 'hải sản', image_url: '/images/ingredients/ca_ngu.jpg' },
  { name: 'tôm', price: 180000, unit: 'kg', category: 'hải sản', image_url: '/images/ingredients/tom.jpg' },
  { name: 'mực', price: 120000, unit: 'kg', category: 'hải sản', image_url: '/images/ingredients/muc.jpg' },
  { name: 'trứng', price: 35000, unit: 'vỉ 10', category: 'sữa trứng', image_url: '/images/ingredients/trung.jpg' },
  { name: 'sữa tươi', price: 32000, unit: 'lít', category: 'sữa trứng', image_url: '/images/ingredients/sua_tuoi.jpg' },
  { name: 'sữa chua', price: 5000, unit: 'hộp', category: 'sữa trứng', image_url: '/images/ingredients/sua_chua.jpg' },
  { name: 'sữa chua không đường', price: 7000, unit: 'hộp', category: 'sữa trứng', image_url: '/images/ingredients/sua_chua.jpg' },
  { name: 'sữa chua ít đường', price: 7000, unit: 'hộp', category: 'sữa trứng', image_url: '/images/ingredients/sua_chua.jpg' },
  { name: 'yến mạch', price: 85000, unit: 'kg', category: 'ngũ cốc', image_url: '/images/ingredients/yen_mach.jpg' },
  { name: 'gạo lứt', price: 35000, unit: 'kg', category: 'ngũ cốc', image_url: '/images/ingredients/gao_lut.jpg' },
  { name: 'cơm', price: 30000, unit: 'kg', category: 'ngũ cốc', image_url: '/images/ingredients/com.jpg' },
  { name: 'bún', price: 35000, unit: 'kg', category: 'ngũ cốc', image_url: '/images/ingredients/bun.jpg' },
  { name: 'bánh phở', price: 28000, unit: 'kg', category: 'ngũ cốc', image_url: '/images/ingredients/banh_pho.jpg' },
  { name: 'bánh mì nguyên cám', price: 40000, unit: 'kg', category: 'ngũ cốc', image_url: '/images/ingredients/banh_mi_nguyen_cam.jpg' },
  { name: 'bột gạo', price: 22000, unit: 'kg', category: 'ngũ cốc', image_url: '/images/ingredients/bot_gao.jpg' },
  { name: 'đậu hũ', price: 25000, unit: 'kg', category: 'đậu', image_url: '/images/ingredients/dau_hu.jpg' },
  { name: 'đậu phộng', price: 75000, unit: 'kg', category: 'hạt', image_url: '/images/ingredients/dau_phong.jpg' },
  { name: 'hạnh nhân', price: 350000, unit: 'kg', category: 'hạt', image_url: '/images/ingredients/hanh_nhan.jpg' },
  { name: 'óc chó', price: 450000, unit: 'kg', category: 'hạt', image_url: '/images/ingredients/oc_cho.jpg' },
  { name: 'hạt chia', price: 320000, unit: 'kg', category: 'hạt', image_url: '/images/ingredients/hat_chia.jpg' },
  { name: 'bông cải xanh', price: 35000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/bong_cai_xanh.jpg' },
  { name: 'cà rốt', price: 18000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/ca_rot.jpg' },
  { name: 'bí đỏ', price: 15000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/bi_do.jpg' },
  { name: 'bí ngòi', price: 12000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/bi_ngoi.jpg' },
  { name: 'xà lách', price: 25000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/xa_lach.jpg' },
  { name: 'dưa leo', price: 15000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/dua_leo.jpg' },
  { name: 'cà chua', price: 20000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/ca_chua.jpg' },
  { name: 'rau muống', price: 8000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/rau_muong.jpg' },
  { name: 'khoai lang', price: 18000, unit: 'kg', category: 'củ', image_url: '/images/ingredients/khoai_lang.jpg' },
  { name: 'khoai tây', price: 25000, unit: 'kg', category: 'củ', image_url: '/images/ingredients/khoai_tay.jpg' },
  { name: 'chuối', price: 25000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/chuoi.jpg' },
  { name: 'táo', price: 65000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/tao.jpg' },
  { name: 'cam', price: 35000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/cam.jpg' },
  { name: 'xoài', price: 45000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/xoai.jpg' },
  { name: 'bơ', price: 85000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/bo.jpg' },
  { name: 'ổi', price: 22000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/oi.jpg' },
  { name: 'dưa hấu', price: 18000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/dua_hau.jpg' },
  { name: 'tỏi', price: 45000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/toi.jpg' },
  { name: 'hành lá', price: 30000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/hanh_la.jpg' },
  { name: 'gừng', price: 35000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/gung.jpg' },
  { name: 'sả', price: 25000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/sa.jpg' },
  { name: 'ớt', price: 40000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/ot.jpg' },
  { name: 'chanh', price: 35000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/chanh.jpg' },
  { name: 'rau thơm', price: 10000, unit: 'bó', category: 'gia vị', image_url: '/images/ingredients/rau_thom.jpg' },
  { name: 'rau mùi', price: 8000, unit: 'bó', category: 'gia vị', image_url: '/images/ingredients/rau_mui.jpg' },
  { name: 'muối', price: 8000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/muoi.jpg' },
  { name: 'tiêu', price: 120000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/tieu.jpg' },
  { name: 'đường', price: 18000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/duong.jpg' },
  { name: 'dầu ô liu', price: 180000, unit: 'lít', category: 'dầu ăn', image_url: '/images/ingredients/dau_o_liu.jpg' },
  { name: 'nước', price: 5000, unit: 'lít', category: 'nước', image_url: '/images/ingredients/nuoc.jpg' },
  { name: 'nước dùng', price: 25000, unit: 'lít', category: 'nước', image_url: '/images/ingredients/nuoc_dung.jpg' },
];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodDB', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function seedIngredients(options = {}) {
  const {
    reset = true,
    exitOnDone = true,
    connect = true,
  } = options;

  try {
    if (connect) {
      await connectDB();
    }

    if (reset) {
      await Ingredient.deleteMany({});
      console.log('Cleared existing ingredients before seeding');
    }

    await Ingredient.insertMany(ingredientsData, { ordered: false });
    console.log(`Seeded ${ingredientsData.length} ingredients`);

    if (exitOnDone) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Seed ingredients error:', error);
    if (exitOnDone) {
      process.exit(1);
    }
    throw error;
  }
}

if (require.main === module) {
  seedIngredients();
}

module.exports = seedIngredients;
