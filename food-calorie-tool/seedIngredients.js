// seedIngredients.js
const mongoose = require('mongoose');
const Ingredient = require('./models/Ingredient');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/foodDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const ingredientsData = [
    // Thịt
    { name: 'ức gà', price: 85000, unit: 'kg', category: 'thịt', image_url: '/images/ingredients/uc_ga.jpg' },
    { name: 'đùi gà', price: 75000, unit: 'kg', category: 'thịt', image_url: '/images/ingredients/dui_ga.jpg' },
    { name: 'nạc heo', price: 120000, unit: 'kg', category: 'thịt', image_url: '/images/ingredients/nac_heo.jpg' },
    { name: 'bò thăn', price: 250000, unit: 'kg', category: 'thịt', image_url: '/images/ingredients/bo_than.jpg' },
    
    // Cá & Hải sản
    { name: 'cá hồi', price: 350000, unit: 'kg', category: 'hải sản', image_url: '/images/ingredients/ca_hoi.jpg' },
    { name: 'cá lóc', price: 95000, unit: 'kg', category: 'hải sản', image_url: '/images/ingredients/ca_loc.jpg' },
    { name: 'cá thu', price: 85000, unit: 'kg', category: 'hải sản', image_url: '/images/ingredients/ca_thu.jpg' },
    { name: 'cá ngừ', price: 150000, unit: 'kg', category: 'hải sản', image_url: '/images/ingredients/ca_ngu.jpg' },
    { name: 'tôm', price: 180000, unit: 'kg', category: 'hải sản', image_url: '/images/ingredients/tom.jpg' },
    { name: 'mực', price: 120000, unit: 'kg', category: 'hải sản', image_url: '/images/ingredients/muc.jpg' },
    { name: 'cua', price: 200000, unit: 'kg', category: 'hải sản', image_url: '/images/ingredients/cua.jpg' },
    
    // Rau củ
    { name: 'bông cải xanh', price: 35000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/bong_cai_xanh.jpg' },
    { name: 'cải thìa', price: 15000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/cai_thia.jpg' },
    { name: 'cà rốt', price: 18000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/ca_rot.jpg' },
    { name: 'bí ngòi', price: 12000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/bi_ngoi.jpg' },
    { name: 'măng tây', price: 65000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/mang_tay.jpg' },
    { name: 'ớt chuông', price: 40000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/ot_chuong.jpg' },
    { name: 'cải bó xôi', price: 20000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/cai_bo_xoi.jpg' },
    { name: 'đậu Hà Lan', price: 35000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/dau_ha_lan.jpg' },
    { name: 'bí đỏ', price: 15000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/bi_do.jpg' },
    { name: 'cải ngọt', price: 12000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/cai_ngot.jpg' },
    { name: 'xà lách', price: 25000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/xa_lach.jpg' },
    { name: 'dưa leo', price: 15000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/dua_leo.jpg' },
    { name: 'cà chua', price: 20000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/ca_chua.jpg' },
    { name: 'rau muống', price: 8000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/rau_muong.jpg' },
    
    // Gia vị
    { name: 'tỏi', price: 45000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/toi.jpg' },
    { name: 'hành lá', price: 30000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/hanh_la.jpg' },
    { name: 'gừng', price: 35000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/gung.jpg' },
    { name: 'sả', price: 25000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/sa.jpg' },
    { name: 'ớt', price: 40000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/ot.jpg' },
    { name: 'nghệ', price: 50000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/nghe.jpg' },
    { name: 'chanh', price: 35000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/chanh.jpg' },
    { name: 'lá chanh', price: 15000, unit: '100g', category: 'gia vị', image_url: '/images/ingredients/la_chanh.jpg' },
    { name: 'lá lốt', price: 20000, unit: '100g', category: 'gia vị', image_url: '/images/ingredients/la_lot.jpg' },
    { name: 'rau thơm', price: 10000, unit: 'bó', category: 'gia vị', image_url: '/images/ingredients/rau_thom.jpg' },
    { name: 'rau mùi', price: 8000, unit: 'bó', category: 'gia vị', image_url: '/images/ingredients/rau_mui.jpg' },
    
    // Nấm
    { name: 'nấm rơm', price: 45000, unit: 'kg', category: 'nấm', image_url: '/images/ingredients/nam_rom.jpg' },
    { name: 'nấm đông cô', price: 120000, unit: 'kg', category: 'nấm', image_url: '/images/ingredients/nam_dong_co.jpg' },
    
    // Sữa & Trứng
    { name: 'trứng', price: 35000, unit: 'vỉ 10', category: 'sữa trứng', image_url: '/images/ingredients/trung.jpg' },
    { name: 'sữa tươi', price: 32000, unit: 'lít', category: 'sữa trứng', image_url: '/images/ingredients/sua_tuoi.jpg' },
    { name: 'sữa chua', price: 5000, unit: 'hộp', category: 'sữa trứng', image_url: '/images/ingredients/sua_chua.jpg' },
    
    // Ngũ cốc
    
    { name: 'gạo lứt', price: 35000, unit: 'kg', category: 'ngũ cốc', image_url: '/images/ingredients/gao_lut.jpg' },
    { name: 'bánh mì nguyên cám', price: 40000, unit: 'kg', category: 'ngũ cốc', image_url: '/images/ingredients/banh_mi_nguyen_cam.jpg' },
    
    // Hạt
    { name: 'hạnh nhân', price: 350000, unit: 'kg', category: 'hạt', image_url: '/images/ingredients/hanh_nhan.jpg' },
    { name: 'óc chó', price: 450000, unit: 'kg', category: 'hạt', image_url: '/images/ingredients/oc_cho.jpg' },
    { name: 'đậu phộng', price: 75000, unit: 'kg', category: 'hạt', image_url: '/images/ingredients/dau_phong.jpg' },
    
    // Trái cây
    { name: 'chuối', price: 25000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/chuoi.jpg' },
    { name: 'táo', price: 65000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/tao.jpg' },
    { name: 'cam', price: 35000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/cam.jpg' },
    { name: 'xoài', price: 45000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/xoai.jpg' },
    { name: 'dâu tây', price: 180000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/dau_tay.jpg' },
    { name: 'bơ', price: 85000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/bo.jpg' },
    
    // Khác
    { name: 'đậu hũ', price: 25000, unit: 'kg', category: 'đậu', image_url: '/images/ingredients/dau_hu.jpg' },
    { name: 'khoai lang', price: 18000, unit: 'kg', category: 'củ', image_url: '/images/ingredients/khoai_lang.jpg' },
    { name: 'muối', price: 8000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/muoi.jpg' },
    { name: 'tiêu', price: 120000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/tieu.jpg' },
    { name: 'dầu ô liu', price: 180000, unit: 'lít', category: 'dầu ăn', image_url: '/images/ingredients/dau_o_liu.jpg' },
    { name: 'nước dừa', price: 15000, unit: 'lít', category: 'nước', image_url: '/images/ingredients/nuoc_dua.jpg' },
    { name: 'mật ong', price: 150000, unit: 'kg', category: 'khác', image_url: '/images/ingredients/mat_ong.jpg' },

    // Các nguyên liệu còn thiếu
    { name: 'rosemary', price: 250000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/rosemary.jpg' },
    { name: 'thyme', price: 280000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/thyme.jpg' },
    { name: 'cà chua bi', price: 35000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/ca_chua_bi.jpg' },
    { name: 'tiêu xanh', price: 350000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/tieu_xanh.jpg' },
    { name: 'quinoa', price: 180000, unit: 'kg', category: 'ngũ cốc', image_url: '/images/ingredients/quinoa.jpg' },
    { name: 'bắp cải', price: 12000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/bap_cai.jpg' },
    { name: 'cá trích', price: 65000, unit: 'kg', category: 'hải sản', image_url: '/images/ingredients/ca_trich.jpg' },
    { name: 'rau sống', price: 15000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/rau_song.jpg' },
    { name: 'me', price: 45000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/me.jpg' },
    { name: 'dọc mùng', price: 12000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/doc_mung.jpg' },
    { name: 'su su', price: 15000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/su_su.jpg' },
    { name: 'khoai tây', price: 25000, unit: 'kg', category: 'củ', image_url: '/images/ingredients/khoai_tay.jpg' },
    { name: 'bí xanh', price: 10000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/bi_xanh.jpg' },
    { name: 'rau dớn', price: 8000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/rau_don.jpg' },
    { name: 'bún', price: 35000, unit: 'kg', category: 'ngũ cốc', image_url: '/images/ingredients/bun.jpg' },
    { name: 'bánh tráng', price: 55000, unit: 'kg', category: 'ngũ cốc', image_url: '/images/ingredients/banh_trang.jpg' },
    { name: 'bánh phở', price: 28000, unit: 'kg', category: 'ngũ cốc', image_url: '/images/ingredients/banh_pho.jpg' },
    { name: 'nước dùng', price: 25000, unit: 'lít', category: 'nước', image_url: '/images/ingredients/nuoc_dung.jpg' },
    { name: 'cơm', price: 30000, unit: 'kg', category: 'ngũ cốc', image_url: '/images/ingredients/com.jpg' },
    { name: 'xôi', price: 35000, unit: 'kg', category: 'ngũ cốc', image_url: '/images/ingredients/xoi.jpg' },
    { name: 'bột gạo', price: 22000, unit: 'kg', category: 'ngũ cốc', image_url: '/images/ingredients/bot_gao.jpg' },
    { name: 'giá', price: 10000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/gia.jpg' },
    { name: 'chả', price: 95000, unit: 'kg', category: 'thịt', image_url: '/images/ingredients/cha.jpg' },
    { name: 'sườn', price: 135000, unit: 'kg', category: 'thịt', image_url: '/images/ingredients/suon.jpg' },
    { name: 'thịt heo băm', price: 110000, unit: 'kg', category: 'thịt', image_url: '/images/ingredients/thit_heo_bam.jpg' },
    { name: 'lá dứa', price: 8000, unit: 'bó', category: 'gia vị', image_url: '/images/ingredients/la_dua.jpg' },
    { name: 'nem', price: 85000, unit: 'kg', category: 'thịt', image_url: '/images/ingredients/nem.jpg' },
    { name: 'bì', price: 65000, unit: 'kg', category: 'thịt', image_url: '/images/ingredients/bi.jpg' },
    { name: 'pate', price: 75000, unit: 'kg', category: 'khác', image_url: '/images/ingredients/pate.jpg' },
    { name: 'khổ qua', price: 18000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/kho_qua.jpg' },
    { name: 'nước mắm chay', price: 35000, unit: 'lít', category: 'gia vị', image_url: '/images/ingredients/nuoc_mam_chay.jpg' },
    { name: 'ngó sen', price: 45000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/ngo_sen.jpg' },
    { name: 'bắp', price: 15000, unit: 'kg', category: 'rau củ', image_url: '/images/ingredients/bap.jpg' },
    { name: 'mè đen', price: 85000, unit: 'kg', category: 'hạt', image_url: '/images/ingredients/me_den.jpg' },
    { name: 'hạt chia', price: 320000, unit: 'kg', category: 'hạt', image_url: '/images/ingredients/hat_chia.jpg' },
    { name: 'đường', price: 18000, unit: 'kg', category: 'gia vị', image_url: '/images/ingredients/duong.jpg' },
    { name: 'vitamin a', price: 150000, unit: 'hộp', category: 'khác', image_url: '/images/ingredients/vitamin_a.jpg' },
    { name: 'vitamin d3', price: 180000, unit: 'hộp', category: 'khác', image_url: '/images/ingredients/vitamin_d3.jpg' },
    { name: 'vitamin c', price: 120000, unit: 'hộp', category: 'khác', image_url: '/images/ingredients/vitamin_c.jpg' },
    { name: 'hương liệu', price: 25000, unit: 'lọ', category: 'gia vị', image_url: '/images/ingredients/huong_lieu.jpg' },
    { name: 'hương dâu', price: 35000, unit: 'lọ', category: 'gia vị', image_url: '/images/ingredients/huong_dau.jpg' },
    { name: 'sữa bột', price: 250000, unit: 'kg', category: 'sữa trứng', image_url: '/images/ingredients/sua_bot.jpg' },
    { name: 'men cái', price: 45000, unit: 'gói', category: 'khác', image_url: '/images/ingredients/men_cai.jpg' },
    { name: 'yến mạch', price: 5000, unit: 'lít', category: 'nước', image_url: '/images/ingredients/yen_mach.jpg' },
    { name: 'nước', price: 5000, unit: 'lít', category: 'nước', image_url: '/images/ingredients/nuoc.jpg' },
    { name: 'phở khô', price: 5000, unit: 'lít', category: 'nước', image_url: '/images/ingredients/banh_pho.jpg' },
    { name: 'sữa nguyên kem', price: 5000, unit: 'lít', category: 'nước', image_url: '/images/ingredients/sua_tuoi.jpg' },
    { name: 'cơm dừa tươi', price: 5000, unit: 'lít', category: 'nước', image_url: '/images/ingredients/dua_tuoi.jpg' },
    { name: 'hồng tươi', price: 5000, unit: 'lít', category: 'nước', image_url: '/images/ingredients/hong.jpg' },
    { name: 'ổi tươi', price: 5000, unit: 'lít', category: 'nước', image_url: '/images/ingredients/oi.jpg' },


    // Trái cây còn thiếu
    { name: 'dưa', price: 28000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/dua.jpg' },
    { name: 'dưa hấu', price: 18000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/dua_hau.jpg' },
    { name: 'thanh long', price: 25000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/thanh_long.jpg' },
    { name: 'ổi', price: 22000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/oi.jpg' },
    { name: 'lê', price: 55000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/le.jpg' },
    { name: 'kiwi', price: 95000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/kiwi.jpg' },
    { name: 'chanh dây', price: 45000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/chanh_day.jpg' },
    { name: 'nho', price: 85000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/nho.jpg' },
    { name: 'bưởi', price: 32000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/buoi.jpg' },
    { name: 'mận', price: 55000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/man.jpg' },
    { name: 'đu đủ', price: 18000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/du_du.jpg' },
    { name: 'sầu riêng', price: 120000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/sau_rieng.jpg' },
    { name: 'vải', price: 65000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/vai.jpg' },
    { name: 'dừa tươi', price: 15000, unit: 'trái', category: 'trái cây', image_url: '/images/ingredients/dua_tuoi.jpg' },
    { name: 'hồng', price: 55000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/hong.jpg' },
    { name: 'lựu', price: 75000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/luu.jpg' },
    { name: 'chôm chôm', price: 35000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/chom_chom.jpg' },
    { name: 'mít', price: 28000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/mit.jpg' },
    { name: 'sapoche', price: 32000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/sapoche.jpg' },
    { name: 'dưa lưới', price: 45000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/dua_luoi.jpg' },
    { name: 'quýt', price: 38000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/quyt.jpg' },
    { name: 'nhãn', price: 42000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/nhan.jpg' },
    { name: 'việt quất', price: 250000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/viet_quat.jpg' },
    { name: 'đào', price: 85000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/dao.jpg' },
    { name: 'khế', price: 22000, unit: 'kg', category: 'trái cây', image_url: '/images/ingredients/khe.jpg' },
    { name: '1 ổ bánh mì', price: 4000, unit: 'kg', category: 'khác', image_url: '/images/ingredients/banh_my.jpg' },
  
    { name: 'sữa chua không đường', price: 7000, unit: 'kg', category: 'khác', image_url: '/images/ingredients/sua_chua.jpg' },
    { name: 'sữa chua ít đường', price: 7000, unit: 'kg', category: 'khác', image_url: '/images/ingredients/sua_chua.jpg' },
    { name: 'sữa chua có đường', price: 7000, unit: 'kg', category: 'khác', image_url: '/images/ingredients/sua_chua.jpg' },
];

const seedIngredients = async () => {
  try {
    await connectDB();
    await Ingredient.deleteMany({});
    console.log('🧹 Đã xoá nguyên liệu cũ');

    await Ingredient.insertMany(ingredientsData);
    console.log(`✅ Đã seed ${ingredientsData.length} nguyên liệu`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi seedIngredients:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedIngredients();
}

module.exports = seedIngredients;
