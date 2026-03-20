import { useCallback, useEffect, useMemo, useState } from 'react'
import { activityOptions, dayOptions, mealTypeLabels } from '../constants/appData'
import { AppContext } from './app-context'
import { api } from '../lib/api'
import {
  clearStoredSession,
  getAdminOverviewLocal,
  getStoredFamilyMenu,
  getStoredMealHistory,
  getStoredMealHistoryDay,
  getStoredPlannerPlan,
  getStoredSession,
  getStoredUsers,
  loginLocalUser,
  registerLocalUser,
  saveStoredMealHistoryDay,
  setStoredFamilyMenu,
  setStoredPlannerPlan,
  updateStoredUserProfile,
} from '../lib/localData'
import { formatCurrency, formatNumber, getDayLabel, getGroupLabel, normalizeSearchText, parseOptionalNumber } from '../utils/formatters'
import { buildDislikesPayload, flattenPlanMeals } from '../utils/planner'
import { buildFamilyMenuLocal } from '../utils/familyMenuEngine'
import { buildShoppingListFromMeals } from '../utils/ingredientCost'
import { buildMealSuggestionLocal } from '../utils/plannerEngine'

const initialPlannerForm = {
  weight: '62',
  height: '165',
  age: '27',
  gender: 'female',
  activity_level: activityOptions[1].value,
  overrideTargetCalories: '',
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

export function AppProvider({ children }) {
  const [session, setSessionState] = useState(getStoredSession)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [plannerForm, setPlannerForm] = useState(initialPlannerForm)
  const [selectedSaveDay, setSelectedSaveDay] = useState(dayOptions[0].value)
  const [mealPlan, setMealPlan] = useState(null)
  const [meals, setMeals] = useState([])
  const [mealQuery, setMealQuery] = useState('')
  const [mealGroup, setMealGroup] = useState('all')
  const [historyDay, setHistoryDay] = useState(dayOptions[0].value)
  const [historyRecords, setHistoryRecords] = useState([])
  const [dailyHistory, setDailyHistory] = useState(null)
  const [shoppingList, setShoppingList] = useState(null)
  const [adminUsersOverview, setAdminUsersOverview] = useState([])
  const [registeredUsersCount, setRegisteredUsersCount] = useState(0)
  const [ingredients, setIngredients] = useState([])
  const [ingredientForm, setIngredientForm] = useState(initialIngredientForm)
  const [ingredientQuery, setIngredientQuery] = useState('')
  const [familyForm, setFamilyForm] = useState(initialFamilyForm)
  const [familyMenu, setFamilyMenu] = useState(null)
  const [minCost, setMinCost] = useState(null)
  const [notice, setNotice] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState({
    boot: true,
    auth: false,
    planner: false,
    savePlan: false,
    history: false,
    ingredient: false,
    family: false,
    adminOverview: false,
  })

  const user = session?.user || null
  const isAdmin = user?.role === 'admin'

  const updateSession = useCallback((nextSession) => {
    setSessionState(nextSession)
  }, [])

  const clearNotice = useCallback(() => setNotice(null), [])

  const setLoadingKey = useCallback((key, value) => {
    setLoading((previous) => ({ ...previous, [key]: value }))
  }, [])

  const resetHistoryState = useCallback(() => {
    setHistoryRecords([])
    setDailyHistory(null)
    setShoppingList(null)
  }, [])

  const resetGuestLockedState = useCallback(() => {
    setMealPlan(null)
    setFamilyMenu(null)
  }, [])

  const resetAdminState = useCallback(() => {
    setAdminUsersOverview([])
    setRegisteredUsersCount(getStoredUsers().length)
  }, [])

  const setSectionError = useCallback((key, message) => {
    setErrors((previous) => {
      const next = { ...previous }

      if (message) next[key] = message
      else delete next[key]

      return next
    })
  }, [])

  const summaryStats = useMemo(() => {
    if (isAdmin) {
      return [
        {
          label: 'Registered users',
          value: formatNumber(registeredUsersCount),
        },
        {
          label: 'Meals available',
          value: formatNumber(meals.length),
        },
        {
          label: 'Ingredients',
          value: formatNumber(ingredients.length),
        },
        {
          label: 'Mode',
          value: 'Admin',
        },
      ]
    }

    return [
      {
        label: 'Meals available',
        value: formatNumber(meals.length),
      },
      {
        label: 'Priced ingredients',
        value: formatNumber(ingredients.length),
      },
      {
        label: 'Saved days',
        value: user ? formatNumber(historyRecords.length) : '--',
      },
      {
        label: 'Minimum budget',
        value: minCost ? formatCurrency(minCost.minCostPerPerson) : 'Updating...',
      },
    ]
  }, [historyRecords.length, ingredients.length, isAdmin, meals.length, minCost, registeredUsersCount, user])

  const mealGroups = useMemo(
    () =>
      [...new Set(meals.map((meal) => meal.group).filter(Boolean))].sort((left, right) =>
        left.localeCompare(right, 'vi'),
      ),
    [meals],
  )

  const filteredMeals = useMemo(() => {
    const searchTerm = normalizeSearchText(mealQuery)

    return meals
      .filter((meal) => (mealGroup === 'all' ? true : meal.group === mealGroup))
      .filter((meal) => {
        if (!searchTerm) return true

        return normalizeSearchText(`${meal.name} ${meal.group} ${getGroupLabel(meal.group)}`).includes(searchTerm)
      })
      .slice(0, 18)
  }, [mealGroup, mealQuery, meals])

  const filteredIngredients = useMemo(() => {
    const searchTerm = ingredientQuery.trim().toLowerCase()

    return ingredients
      .filter((ingredient) => {
        if (!searchTerm) return true

        return `${ingredient.name} ${ingredient.category || ''} ${ingredient.unit || ''}`
          .toLowerCase()
          .includes(searchTerm)
      })
      .slice(0, 16)
  }, [ingredientQuery, ingredients])

  const savedDays = useMemo(
    () => new Set(historyRecords.map((entry) => entry.day)),
    [historyRecords],
  )

  const historyMeals = useMemo(
    () =>
      (dailyHistory?.meals || []).map((meal) => ({
        name: meal.mealName || meal.mealId?.name || 'Meal',
        group: meal.mealId?.group || meal.mealType || 'history',
        image_url: meal.image_url || meal.mealId?.image_url || '',
        calories: meal.calories ?? meal.mealId?.calories ?? 0,
        protein: meal.protein ?? meal.mealId?.protein ?? 0,
        fat: meal.fat ?? meal.mealId?.fat ?? 0,
        carbs: meal.carbs ?? meal.mealId?.carbs ?? 0,
        ingredients: meal.ingredients || meal.mealId?.ingredients || [],
        instructions: meal.mealId?.instructions || '',
        caption: mealTypeLabels[meal.mealType] || 'Saved meal',
      })),
    [dailyHistory],
  )

  const historyCalories = useMemo(
    () => historyMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
    [historyMeals],
  )

  const recommendedFamilyBudget = useMemo(() => {
    const members = Number(familyForm.familySize) || 1
    return minCost ? minCost.minCostPerPerson * members : 0
  }, [familyForm.familySize, minCost])

  useEffect(() => {
    async function loadInitialData() {
      setLoadingKey('boot', true)
      setSectionError('boot', '')
      setSectionError('familyMinCost', '')
      setRegisteredUsersCount(getStoredUsers().length)
      updateSession(getStoredSession())

      const requests = [api.getMeals(), api.getIngredients(), api.getFamilyMinCost()]

      const [mealsResult, ingredientsResult, minCostResult] = await Promise.allSettled(requests)
      const bootIssues = []

      if (mealsResult.status === 'fulfilled') setMeals(mealsResult.value)
      else bootIssues.push(`Unable to load meals: ${mealsResult.reason.message}`)

      if (ingredientsResult.status === 'fulfilled') setIngredients(ingredientsResult.value)
      else bootIssues.push(`Unable to load ingredient pricing: ${ingredientsResult.reason.message}`)

      if (minCostResult.status === 'fulfilled') setMinCost(minCostResult.value)
      else setSectionError('familyMinCost', minCostResult.reason.message)

      if (bootIssues.length) setSectionError('boot', bootIssues.join(' | '))
      setLoadingKey('boot', false)
    }

    loadInitialData()
  }, [setLoadingKey, setSectionError, updateSession])

  const refreshMeals = useCallback(async () => {
    const result = await api.getMeals()
    setMeals(result)
    return result
  }, [])

  useEffect(() => {
    if (!user?.userId) {
      resetHistoryState()
      resetGuestLockedState()
      return
    }

    setSectionError('historyOverview', '')
    setHistoryRecords(getStoredMealHistory(user.userId))
    setMealPlan(getStoredPlannerPlan(user.userId))
    setFamilyMenu(getStoredFamilyMenu(user.userId))
  }, [resetGuestLockedState, resetHistoryState, setSectionError, user])

  useEffect(() => {
    if (!user?.userId) return

    setLoadingKey('history', true)
    setSectionError('historyDay', '')

    const history = getStoredMealHistoryDay(user.userId, historyDay)
    setDailyHistory(history)
    setShoppingList(history ? buildShoppingListFromMeals(history.meals || [], ingredients) : null)

    setLoadingKey('history', false)
  }, [historyDay, ingredients, setLoadingKey, setSectionError, user])

  const refreshAdminOverview = useCallback(async () => {
    setLoadingKey('adminOverview', true)
    setSectionError('adminOverview', '')

    try {
      const result = getAdminOverviewLocal()
      setAdminUsersOverview(result.users || [])
      setRegisteredUsersCount(result.registeredUsersCount || 0)
    } catch (error) {
      setSectionError('adminOverview', error.message)
    } finally {
      setLoadingKey('adminOverview', false)
    }
  }, [setLoadingKey, setSectionError])

  useEffect(() => {
    if (!user?.userId || !isAdmin) {
      resetAdminState()
      return
    }

    refreshAdminOverview()
  }, [isAdmin, refreshAdminOverview, resetAdminState, user])

  async function refreshHistory(userId, day) {
    const records = getStoredMealHistory(userId)
    const history = getStoredMealHistoryDay(userId, day)

    setHistoryRecords(records)
    setDailyHistory(history)
    setShoppingList(history ? buildShoppingListFromMeals(history.meals || [], ingredients) : null)
  }

  async function refreshPricing() {
    const [ingredientsResult, minCostResult] = await Promise.allSettled([
      api.getIngredients(),
      api.getFamilyMinCost(),
    ])

    if (ingredientsResult.status === 'fulfilled') setIngredients(ingredientsResult.value)
    if (minCostResult.status === 'fulfilled') {
      setMinCost(minCostResult.value)
      setSectionError('familyMinCost', '')
    } else {
      setSectionError('familyMinCost', minCostResult.reason.message)
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setLoadingKey('auth', true)
    setSectionError('auth', '')

    try {
      const nextUser = authMode === 'register' ? registerLocalUser(authForm) : loginLocalUser(authForm)

      updateSession({ user: nextUser })
      setRegisteredUsersCount(getStoredUsers().length)

      setNotice({
        tone: 'success',
        message:
          authMode === 'register'
            ? `Account created and signed in as ${nextUser.email}.`
            : `Signed in as ${nextUser.email}.`,
      })
      setAuthForm((previous) => ({ ...previous, password: '' }))
      setAuthMode('login')
    } catch (error) {
      setSectionError('auth', error.message)
    } finally {
      setLoadingKey('auth', false)
    }
  }

  async function handleLogout() {
    clearStoredSession()
    setSectionError('auth', '')
    updateSession(null)
    resetAdminState()
    resetHistoryState()
    resetGuestLockedState()
    setNotice({ tone: 'info', message: 'You have signed out of the current session.' })
  }

  function resetPlannerForm() {
    setPlannerForm(initialPlannerForm)
  }

  function resetIngredientForm() {
    setIngredientForm(initialIngredientForm)
  }

  async function handlePlannerSubmit(event) {
    event.preventDefault()

    setLoadingKey('planner', true)
    setSectionError('planner', '')

    const payload = {
      weight: Number(plannerForm.weight),
      height: Number(plannerForm.height),
      gender: plannerForm.gender,
      activity_level: plannerForm.activity_level,
      dislikes: buildDislikesPayload(plannerForm),
    }

    const age = parseOptionalNumber(plannerForm.age)
    const overrideTargetCalories = parseOptionalNumber(plannerForm.overrideTargetCalories)

    if (age !== undefined) payload.age = age
    if (overrideTargetCalories !== undefined) payload.overrideTargetCalories = overrideTargetCalories

    try {
      const result = buildMealSuggestionLocal({ allMeals: meals, ...payload })
      setMealPlan(result)

      if (user?.userId) {
        setStoredPlannerPlan(user.userId, result)
        const updatedUser = updateStoredUserProfile(user.userId, {
          latestPlannerProfile: {
            weight: payload.weight,
            height: payload.height,
            age: payload.age ?? null,
            gender: payload.gender,
            activity_level: payload.activity_level,
            goal: result.goal,
            bmi: Number.parseFloat(result.bmi),
            targetCaloriesPerDay: result.targetCaloriesPerDay,
            updatedAt: new Date().toISOString(),
          },
        })

        if (updatedUser) {
          updateSession({ user: updatedUser })
        }
      }

      setNotice({
        tone: 'success',
        message: `Created a meal suggestion with ${formatNumber(result.selectedCalories)} kcal for the day.`,
      })
    } catch (error) {
      setMealPlan(null)
      setSectionError('planner', error.message)
    } finally {
      setLoadingKey('planner', false)
    }
  }

  async function handleSavePlan() {
    if (!user?.userId) {
      setNotice({
        tone: 'info',
        message: 'Sign in before saving a plan into meal history.',
      })
      return false
    }

    const mealsToSave = flattenPlanMeals(mealPlan)

    if (!mealsToSave.length) {
      setSectionError('planner', 'No plan data is available to save into history.')
      return false
    }

    setLoadingKey('savePlan', true)
    setSectionError('planner', '')

    try {
      saveStoredMealHistoryDay(user.userId, selectedSaveDay, mealsToSave)

      await refreshHistory(user.userId, selectedSaveDay)
      setHistoryDay(selectedSaveDay)
      setNotice({
        tone: 'success',
        message: `Saved this plan to ${getDayLabel(selectedSaveDay)}. Your shopping list is ready in History.`,
      })

      return true
    } catch (error) {
      setSectionError('planner', error.message)
      return false
    } finally {
      setLoadingKey('savePlan', false)
    }
  }

  async function handleIngredientSubmit(event) {
    event.preventDefault()
    setLoadingKey('ingredient', true)
    setSectionError('ingredient', '')

    const payload = {
      name: ingredientForm.name.trim(),
      price: parseOptionalNumber(ingredientForm.price) ?? 0,
      unit: ingredientForm.unit.trim() || 'kg',
      category: ingredientForm.category.trim() || undefined,
      image_url: ingredientForm.image_url.trim() || undefined,
    }

    try {
      await api.upsertIngredient(payload)
      await refreshPricing()
      resetIngredientForm()
      setNotice({
        tone: 'success',
        message: `Updated pricing for ingredient ${payload.name}.`,
      })
    } catch (error) {
      setSectionError('ingredient', error.message)
    } finally {
      setLoadingKey('ingredient', false)
    }
  }

  async function handleFamilySubmit(event) {
    event.preventDefault()

    setLoadingKey('family', true)
    setSectionError('family', '')

    try {
      const result = buildFamilyMenuLocal({
        meals,
        ingredients,
        familySize: Number(familyForm.familySize),
        weeklyBudget: Number(familyForm.weeklyBudget),
      })

      setFamilyMenu(result)

      if (user?.userId) {
        setStoredFamilyMenu(user.userId, result)
      }

      setNotice({
        tone: 'success',
        message: `Generated a family menu for ${result.familySize} people with a total cost of ${formatCurrency(result.totalWeekCost)}.`,
      })
    } catch (error) {
      setFamilyMenu(null)
      setSectionError('family', error.message)
    } finally {
      setLoadingKey('family', false)
    }
  }

  const value = {
    session,
    user,
    isAdmin,
    authMode,
    setAuthMode,
    authForm,
    setAuthForm,
    plannerForm,
    setPlannerForm,
    selectedSaveDay,
    setSelectedSaveDay,
    mealPlan,
    meals,
    mealQuery,
    setMealQuery,
    mealGroup,
    setMealGroup,
    historyDay,
    setHistoryDay,
    historyRecords,
    dailyHistory,
    shoppingList,
    adminUsersOverview,
    registeredUsersCount,
    ingredients,
    ingredientForm,
    setIngredientForm,
    ingredientQuery,
    setIngredientQuery,
    familyForm,
    setFamilyForm,
    familyMenu,
    minCost,
    notice,
    setNotice,
    clearNotice,
    errors,
    loading,
    summaryStats,
    mealGroups,
    filteredMeals,
    filteredIngredients,
    savedDays,
    historyMeals,
    historyCalories,
    recommendedFamilyBudget,
    refreshAdminOverview,
    handleAuthSubmit,
    handleLogout,
    resetPlannerForm,
    resetIngredientForm,
    handlePlannerSubmit,
    handleSavePlan,
    handleIngredientSubmit,
    handleFamilySubmit,
    refreshPricing,
    refreshMeals,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
