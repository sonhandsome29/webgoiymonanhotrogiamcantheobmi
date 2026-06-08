import { create } from 'zustand'
import { api } from '../lib/api'
import { activityOptions, dayOptions } from '../constants/appData'
import { buildShoppingListFromMeals } from '../utils/ingredientCost'

const initialPlannerForm = {
  weight: '62',
  height: '165',
  age: '27',
  gender: 'female',
  activity_level: activityOptions[1].value,
  dislikedGroups: '',
  dislikedIngredients: '',
  dislikedMeals: '',
}

const initialIngredientForm = {
  name: '',
  price: '',
  unit: 'kg',
  category: '',
  image_url: '',
}

const initialFamilyForm = {
  familySize: '4',
  weeklyBudget: '',
}

export const useAppStore = create((set, get) => ({
  // Core Data States
  meals: [],
  ingredients: [],
  minCost: null,

  // UI Form States
  plannerForm: initialPlannerForm,
  selectedSaveDay: dayOptions[0].value,
  mealPlan: null,
  mealQuery: '',
  mealGroup: 'all',

  historyDay: dayOptions[0].value,
  historyRecords: [],
  dailyHistory: null,
  shoppingList: null,

  ingredientForm: initialIngredientForm,
  ingredientQuery: '',

  familyForm: initialFamilyForm,
  familyMenu: null,
  language: localStorage.getItem('app_language') || 'vi',

  // General Notification / Error States
  notice: null,
  errors: {},

  // Loading flags
  loading: {
    boot: false,
    planner: false,
    savePlan: false,
    history: false,
    ingredient: false,
    family: false,
  },

  // Synchronous Actions
  setLanguage: (lang) => {
    localStorage.setItem('app_language', lang)
    set({ language: lang })
  },
  setPlannerForm: (plannerForm) => set({ plannerForm }),
  setSelectedSaveDay: (selectedSaveDay) => set({ selectedSaveDay }),
  setMealQuery: (mealQuery) => set({ mealQuery }),
  setMealGroup: (mealGroup) => set({ mealGroup }),
  setHistoryDay: (historyDay) => set({ historyDay }),
  setIngredientForm: (ingredientForm) => set({ ingredientForm }),
  setIngredientQuery: (ingredientQuery) => set({ ingredientQuery }),
  setFamilyForm: (familyForm) => set({ familyForm }),
  setFamilyMenu: (familyMenu) => set({ familyMenu }),
  setNotice: (notice) => set({ notice }),
  clearNotice: () => set({ notice: null }),
  setErrors: (errors) => set({ errors }),
  clearErrors: () => set({ errors: {} }),
  setLoadingKey: (key, val) =>
    set((state) => ({ loading: { ...state.loading, [key]: val } })),

  // Asynchronous Backend Actions
  fetchMeals: async () => {
    try {
      const meals = await api.getMeals()
      set({ meals })
      return meals
    } catch (err) {
      console.error('Error fetching meals:', err)
      throw err
    }
  },

  fetchIngredients: async () => {
    try {
      const ingredients = await api.getIngredients()
      set({ ingredients })
      return ingredients
    } catch (err) {
      console.error('Error fetching ingredients:', err)
      throw err
    }
  },

  fetchFamilyMinCost: async () => {
    try {
      const minCost = await api.getFamilyMinCost()
      set({ minCost })
      return minCost
    } catch (err) {
      console.error('Error fetching family min cost:', err)
      throw err
    }
  },

  // GA Suggestion
  generateMealPlan: async (payload) => {
    get().setLoadingKey('planner', true)
    get().clearErrors()
    try {
      const plan = await api.suggestMeals(payload)
      set({ mealPlan: plan })
      return plan
    } catch (err) {
      set({ errors: { planner: err.message || 'Lỗi khi tạo thực đơn gợi ý.' } })
      throw err
    } finally {
      get().setLoadingKey('planner', false)
    }
  },

  // Meal History Actions
  fetchMealHistory: async (userId) => {
    if (!userId) return
    get().setLoadingKey('history', true)
    try {
      const histories = await api.getMealHistory(userId)
      set({ historyRecords: histories })
    } catch (err) {
      console.error('Error fetching meal histories:', err)
    } finally {
      get().setLoadingKey('history', false)
    }
  },

  fetchMealHistoryDay: async (userId, day) => {
    if (!userId || !day) return
    get().setLoadingKey('history', true)
    try {
      const history = await api.getMealHistoryDay(userId, day)
      set({ dailyHistory: history })
      if (history?.meals?.length) {
        // Calculate shopping list for this day
        const list = buildShoppingListFromMeals(history.meals, get().ingredients)
        set({ shoppingList: list })
      } else {
        set({ shoppingList: null })
      }
    } catch (err) {
      console.error('Error fetching daily meal history:', err)
    } finally {
      get().setLoadingKey('history', false)
    }
  },

  saveMealHistoryDay: async (userId, day, planMeals) => {
    if (!userId || !day || !planMeals) return
    get().setLoadingKey('savePlan', true)
    try {
      await api.saveMealHistoryDay(userId, day, planMeals)
      set({ notice: `Đã lưu thực đơn ngày ${day} thành công!` })
      // Refresh histories
      await get().fetchMealHistory(userId)
      if (get().historyDay === day) {
        await get().fetchMealHistoryDay(userId, day)
      }
      return true
    } catch (err) {
      console.error('Error saving meal history:', err)
      set({ notice: `Lỗi: ${err.message || 'Không thể lưu thực đơn.'}` })
    } finally {
      get().setLoadingKey('savePlan', false)
    }
  },

  // Family Menu Actions
  generateFamilyMenuAction: async (payload) => {
    get().setLoadingKey('family', true)
    get().clearErrors()
    try {
      const response = await api.generateFamilyMenu(payload)
      set({ familyMenu: response })
      set({ notice: 'Lập thực đơn tuần cho gia đình thành công!' })
    } catch (err) {
      set({ errors: { family: err.message || 'Lỗi khi lập thực đơn gia đình.' } })
    } finally {
      get().setLoadingKey('family', false)
    }
  },

  fetchFamilyMenuHistory: async (userId) => {
    if (!userId) return
    get().setLoadingKey('family', true)
    try {
      const results = await api.getFamilyMenuHistory(userId)
      if (results && results.length > 0) {
        // Show the latest generated menu as active
        set({ familyMenu: results[0] })
      }
    } catch (err) {
      console.error('Error fetching family menus:', err)
    } finally {
      get().setLoadingKey('family', false)
    }
  },

  // Catalog Meal Management
  createMealAction: async (payload) => {
    get().setLoadingKey('ingredient', true)
    try {
      await api.createMeal(payload)
      set({ notice: 'Đã tạo món ăn mới thành công.' })
      await get().fetchMeals()
    } catch (err) {
      set({ notice: `Lỗi: ${err.message || 'Không thể tạo món ăn.'}` })
    } finally {
      get().setLoadingKey('ingredient', false)
    }
  },

  updateMealAction: async (mealId, payload) => {
    get().setLoadingKey('ingredient', true)
    try {
      await api.updateMeal(mealId, payload)
      set({ notice: 'Đã cập nhật món ăn thành công.' })
      await get().fetchMeals()
    } catch (err) {
      set({ notice: `Lỗi: ${err.message || 'Không thể cập nhật.'}` })
    } finally {
      get().setLoadingKey('ingredient', false)
    }
  },

  deleteMealAction: async (mealId) => {
    get().setLoadingKey('ingredient', true)
    try {
      await api.deleteMeal(mealId)
      set({ notice: 'Đã xóa món ăn thành công.' })
      await get().fetchMeals()
    } catch (err) {
      set({ notice: `Lỗi: ${err.message || 'Không thể xóa.'}` })
    } finally {
      get().setLoadingKey('ingredient', false)
    }
  },

  // Catalog Ingredient Management
  upsertIngredientAction: async (payload) => {
    get().setLoadingKey('ingredient', true)
    try {
      await api.upsertIngredient(payload)
      set({ notice: 'Đã lưu nguyên liệu thành công.' })
      await get().fetchIngredients()
    } catch (err) {
      set({ notice: `Lỗi: ${err.message || 'Không thể lưu nguyên liệu.'}` })
    } finally {
      get().setLoadingKey('ingredient', false)
    }
  },

  deleteIngredientAction: async (ingredientId) => {
    get().setLoadingKey('ingredient', true)
    try {
      await api.deleteIngredient(ingredientId)
      set({ notice: 'Đã xóa nguyên liệu thành công.' })
      await get().fetchIngredients()
    } catch (err) {
      set({ notice: `Lỗi: ${err.message || 'Không thể xóa nguyên liệu.'}` })
    } finally {
      get().setLoadingKey('ingredient', false)
    }
  },
}))
