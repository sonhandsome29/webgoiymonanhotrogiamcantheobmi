const axios = require('axios');
const Meal = require('./models/Meal'); // Import mô hình Meal

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

const fetchMealData = async (query) => {
    try {
        // Gửi yêu cầu đến TheMealDB API
        const response = await axios.get(`${BASE_URL}/search.php`, {
            params: {
                s: query // Từ khóa tìm kiếm (ví dụ: "chicken")
            }
        });

        const meal = response.data.meals[0]; // Lấy món đầu tiên
        if (!meal) throw new Error('No meal found');

        // Lấy danh sách nguyên liệu
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ingredient && ingredient.trim()) {
                ingredients.push(`${measure} ${ingredient}`);
            } else {
                break;
            }
        }

        // Tìm món ăn tương ứng trong cơ sở dữ liệu MongoDB
        const localMeal = await Meal.findOne({ name: meal.strMeal });
        const imageUrl = localMeal ? localMeal.image_url : '/images/default-meal.jpg'; // Fallback nếu không tìm thấy

        return {
            name: meal.strMeal,
            ingredients: ingredients,
            instructions: meal.strInstructions,
            calories: null, // TheMealDB không cung cấp calo
            image_url: imageUrl // Thêm image_url từ MongoDB
        };
    } catch (error) {
        console.error('Error fetching meal from TheMealDB:', error.message);
        throw error;
    }
};

module.exports = { fetchMealData };