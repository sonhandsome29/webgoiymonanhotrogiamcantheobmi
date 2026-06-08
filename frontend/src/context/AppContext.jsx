import { useCallback, useEffect, useMemo, useState } from 'react'
import { activityOptions, mealTypeLabels } from '../constants/appData'
import { AppContext } from './app-context'
import { formatCurrency, formatNumber, getGroupLabel, normalizeSearchText, parseOptionalNumber } from '../utils/formatters'
import { buildDislikesPayload, flattenPlanMeals } from '../utils/planner'

// Redux & Zustand stores
import { Provider, useDispatch, useSelector } from 'react-redux'
import { store } from '../store'
import { loginUser, registerUser, updateUserProfile, logout, fetchAdminOverview, clearAuthError, fetchCurrentUser } from '../store/authSlice'
import { useAppStore } from '../store/useAppStore'
import { translations } from '../constants/translations'

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

function InnerAppProvider({ children }) {
  // Extract state & actions from Zustand
  const {
    meals,
    ingredients,
    minCost,
    plannerForm,
    selectedSaveDay,
    mealPlan,
    mealQuery,
    mealGroup,
    historyDay,
    historyRecords,
    dailyHistory,
    shoppingList,
    ingredientForm,
    ingredientQuery,
    familyForm,
    familyMenu,
    notice,
    errors,
    loading,
    setPlannerForm,
    setSelectedSaveDay,
    setMealQuery,
    setMealGroup,
    setHistoryDay,
    setIngredientForm,
    setIngredientQuery,
    setFamilyForm,
    setNotice,
    clearNotice,
    setErrors,
    clearErrors,
    setLoadingKey,
    fetchMeals,
    fetchIngredients,
    fetchFamilyMinCost,
    generateMealPlan,
    fetchMealHistory,
    fetchMealHistoryDay,
    saveMealHistoryDay,
    generateFamilyMenuAction,
    fetchFamilyMenuHistory,
    upsertIngredientAction,
    language,
    setLanguage,
  } = useAppStore()

  const t = useCallback((key) => {
    return translations[language]?.[key] || translations['vi']?.[key] || key
  }, [language])

  // Redux Auth state & Dispatcher
  const dispatch = useDispatch()
  const auth = useSelector((state) => state.auth)
  const user = auth.user
  const session = useMemo(() => (user ? { user } : null), [user])
  const isAdmin = user?.role === 'admin'

  // Local UI state for authentication
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })

  // Combine Redux loading & errors into context format
  const combinedLoading = useMemo(() => ({
    ...loading,
    auth: auth.loading,
    adminOverview: auth.adminLoading,
  }), [loading, auth.loading, auth.adminLoading])

  const combinedErrors = useMemo(() => ({
    ...errors,
    auth: auth.error || errors.auth || '',
    adminOverview: auth.adminError || errors.adminError || '',
  }), [errors, auth.error, auth.adminError])

  const summaryStats = useMemo(() => {
    if (isAdmin) {
      return [
        {
          label: t('stat_registered_users'),
          value: formatNumber(auth.adminOverview.registeredUsersCount),
        },
        {
          label: t('stat_meals_available'),
          value: formatNumber(auth.adminOverview.mealCount || meals.length),
        },
        {
          label: t('stat_ingredients'),
          value: formatNumber(auth.adminOverview.ingredientCount || ingredients.length),
        },
        {
          label: t('stat_mode'),
          value: t('mode_admin'),
        },
      ]
    }

    return [
      {
        label: t('stat_meals_available'),
        value: formatNumber(meals.length),
      },
      {
        label: t('stat_priced_ingredients'),
        value: formatNumber(ingredients.length),
      },
      {
        label: t('stat_saved_days'),
        value: user ? formatNumber(historyRecords.length) : '--',
      },
      {
        label: t('stat_min_budget'),
        value: minCost ? formatCurrency(minCost.minCostPerPerson) : t('stat_updating'),
      },
    ]
  }, [auth.adminOverview, historyRecords.length, ingredients.length, isAdmin, meals.length, minCost, user, t])

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
        name: meal.name || meal.mealName || meal.mealId?.name || 'Meal',
        group: meal.group || meal.mealId?.group || meal.mealType || 'history',
        image_url: meal.image_url || meal.mealId?.image_url || '',
        calories: meal.calories ?? meal.mealId?.calories ?? 0,
        protein: meal.protein ?? meal.mealId?.protein ?? 0,
        fat: meal.fat ?? meal.mealId?.fat ?? 0,
        carbs: meal.carbs ?? meal.mealId?.carbs ?? 0,
        ingredients: meal.ingredients || meal.mealId?.ingredients || [],
        instructions: meal.mealId?.instructions || '',
        caption: mealTypeLabels[meal.mealType] || t('history'),
      })),
    [dailyHistory, t],
  )

  const historyCalories = useMemo(
    () => historyMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
    [historyMeals],
  )

  const recommendedFamilyBudget = useMemo(() => {
    const members = Number(familyForm.familySize) || 1
    return minCost ? minCost.minCostPerPerson * members : 0
  }, [familyForm.familySize, minCost])

  // Load initial backend catalog data on mount
  useEffect(() => {
    async function loadInitialData() {
      setLoadingKey('boot', true)
      setErrors({ ...errors, boot: '' })

      try {
        await Promise.all([
          fetchMeals(),
          fetchIngredients(),
          fetchFamilyMinCost()
        ])
      } catch (err) {
        console.error('Boot error:', err)
        setErrors({ ...errors, boot: t('err_boot') })
      } finally {
        setLoadingKey('boot', false)
      }
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    if (auth.token) {
      dispatch(fetchCurrentUser())
    }
  }, [auth.token, dispatch])

  // Sync user profile & data when user logs in/out
  useEffect(() => {
    if (!user?.userId) {
      useAppStore.setState({
        historyRecords: [],
        dailyHistory: null,
        shoppingList: null,
        mealPlan: null,
        familyMenu: null,
      })
      return
    }

    if (user.latestPlannerProfile) {
      const profile = user.latestPlannerProfile
      setPlannerForm({
        weight: profile.weight || '62',
        height: profile.height || '165',
        age: profile.age || '27',
        gender: profile.gender || 'female',
        activity_level: profile.activity_level || activityOptions[1].value,
        dislikedGroups: profile.dislikedGroups || '',
        dislikedIngredients: profile.dislikedIngredients || '',
        dislikedMeals: profile.dislikedMeals || '',
      })
    }

    fetchMealHistory(user.userId)
    fetchFamilyMenuHistory(user.userId)
  }, [user])

  // Fetch daily history details when day or ingredients catalog changes
  useEffect(() => {
    if (!user?.userId) return
    fetchMealHistoryDay(user.userId, historyDay)
  }, [historyDay, user, fetchMealHistoryDay, ingredients])

  // Admin Dashboard stats
  const refreshAdminOverview = useCallback(async () => {
    if (!user?.userId || !isAdmin) return
    dispatch(fetchAdminOverview())
  }, [user, isAdmin, dispatch])

  useEffect(() => {
    refreshAdminOverview()
  }, [user, isAdmin, refreshAdminOverview])

  // Authentication Submission
  async function handleAuthSubmit(event) {
    event.preventDefault()
    dispatch(clearAuthError())

    if (authMode === 'register') {
      const password = authForm.password || ''
      if (password.length < 8) {
        setErrors({ ...errors, auth: t('err_pass_length') })
        return
      }
      if (!/[a-z]/.test(password)) {
        setErrors({ ...errors, auth: t('err_pass_lower') })
        return
      }
      if (!/[A-Z]/.test(password)) {
        setErrors({ ...errors, auth: t('err_pass_upper') })
        return
      }
      if (!/\d/.test(password)) {
        setErrors({ ...errors, auth: t('err_pass_number') })
        return
      }
      if (!/[^a-zA-Z0-9]/.test(password)) {
        setErrors({ ...errors, auth: t('err_pass_special') })
        return
      }
    }

    try {
      const action = authMode === 'register' ? registerUser(authForm) : loginUser(authForm)
      const nextUser = await dispatch(action).unwrap()

      setNotice({
        tone: 'success',
        message:
          authMode === 'register'
            ? `${t('notice_account_created')} ${nextUser.email}.`
            : `${t('notice_signed_in')} ${nextUser.email}.`,
      })
      setAuthForm((previous) => ({ ...previous, password: '' }))
      setAuthMode('login')
    } catch (error) {
      setErrors({ ...errors, auth: error || t('err_auth_failed') })
    }
  }

  // Logout
  async function handleLogout() {
    dispatch(logout())
    clearErrors()
    setNotice({ tone: 'info', message: t('notice_signed_out') })
  }

  function resetPlannerForm() {
    setPlannerForm(initialPlannerForm)
  }

  function resetIngredientForm() {
    setIngredientForm(initialIngredientForm)
  }

  // Suggest Meals (using backend GA API)
  async function handlePlannerSubmit(event) {
    event.preventDefault()
    setErrors({ ...errors, planner: '' })

    const payload = {
      weight: Number(plannerForm.weight),
      height: Number(plannerForm.height),
      gender: plannerForm.gender,
      activity_level: plannerForm.activity_level,
      dislikes: buildDislikesPayload(plannerForm),
    }

    const age = parseOptionalNumber(plannerForm.age)
    if (age !== undefined) payload.age = age

    try {
      await generateMealPlan(payload)

      const result = useAppStore.getState().mealPlan
      if (!result) {
        throw new Error(t('err_gen_failed'))
      }

      if (user?.userId) {
        await dispatch(updateUserProfile({
          userId: user.userId,
          profileData: {
            weight: String(payload.weight),
            height: String(payload.height),
            age: String(payload.age ?? ''),
            gender: String(payload.gender),
            activity_level: String(payload.activity_level),
            dislikedGroups: plannerForm.dislikedGroups,
            dislikedIngredients: plannerForm.dislikedIngredients,
            dislikedMeals: plannerForm.dislikedMeals
          }
        })).unwrap()
      }

      setNotice({
        tone: 'success',
        message: `${t('notice_meal_created')} ${formatNumber(result.selectedCalories)} kcal.`,
      })
    } catch (error) {
      useAppStore.setState({ mealPlan: null })
      setErrors({ ...errors, planner: error.message || t('err_boot') })
    }
  }

  // Save Meal plan to daily history
  async function handleSavePlan() {
    if (!user?.userId) {
      setNotice({
        tone: 'info',
        message: t('notice_sign_in_first'),
      })
      return false
    }

    const mealsToSave = flattenPlanMeals(mealPlan)
    if (!mealsToSave.length) {
      setErrors({ ...errors, planner: t('err_no_plan') })
      return false
    }

    try {
      await saveMealHistoryDay(user.userId, selectedSaveDay, mealsToSave)
      return true
    } catch (error) {
      setErrors({ ...errors, planner: error.message })
      return false
    }
  }

  // Replace a single meal in suggested plan
  function findReplacementMeal(sectionName, currentMealId) {
    const dislikes = buildDislikesPayload(plannerForm)
    const takenMealIds = new Set(
      flattenPlanMeals(mealPlan)
        .map((meal) => meal.mealId)
        .filter((mealId) => mealId && mealId !== currentMealId),
    )

    const dislikedIngredients = (dislikes.dislikedIngredients || []).map((item) => String(item).toLowerCase())
    const currentMeal = meals.find((meal) => meal._id === currentMealId)

    const candidates = meals.filter((meal) => {
      if (meal._id === currentMealId) return false
      if (takenMealIds.has(meal._id)) return false
      if (dislikes.dislikedMeals?.includes(meal.name)) return false
      if (dislikes.dislikedGroups?.includes(meal.group)) return false

      const ingredientText = (meal.ingredients || []).join(' ').toLowerCase()
      if (dislikedIngredients.some((ingredient) => ingredientText.includes(ingredient))) return false

      if (sectionName === 'Breakfast') {
        return meal.group === currentMeal?.group || /bánh mì|phở|bún|xôi|cháo/i.test(meal.name)
      }

      if (sectionName === 'Lunch' || sectionName === 'Dinner') {
        return meal.group === currentMeal?.group
      }

      return true
    })

    if (!candidates.length) {
      throw new Error(t('err_no_replacement'))
    }

    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  function recalculateMealPlan(nextSections) {
    const selectedCalories = nextSections.reduce(
      (sum, section) => sum + (section.details || []).reduce((mealSum, meal) => mealSum + (meal.calories || 0), 0),
      0,
    )

    return {
      ...mealPlan,
      selectedCalories,
      meals: nextSections,
    }
  }

  function handleReplaceMeal(sectionName, currentMealId) {
    try {
      const replacement = findReplacementMeal(sectionName, currentMealId)
      const nextSections = (mealPlan?.meals || []).map((section) => {
        if (section.meal !== sectionName) return section

        return {
          ...section,
          details: (section.details || []).map((meal) => (meal._id === currentMealId ? replacement : meal)),
        }
      })

      const nextPlan = recalculateMealPlan(nextSections)
      useAppStore.setState({ mealPlan: nextPlan })
      setNotice({ tone: 'success', message: `${t('notice_replaced')} ${replacement.name}.` })
    } catch (error) {
      setErrors({ ...errors, planner: error.message })
    }
  }

  // Catalog Ingredient Pricing Submit
  async function handleIngredientSubmit(event) {
    event.preventDefault()
    setErrors({ ...errors, ingredient: '' })

    const payload = {
      name: ingredientForm.name.trim(),
      price: parseOptionalNumber(ingredientForm.price) ?? 0,
      unit: ingredientForm.unit.trim() || 'kg',
      category: ingredientForm.category.trim() || undefined,
      image_url: ingredientForm.image_url.trim() || undefined,
    }

    try {
      await upsertIngredientAction(payload)
      await fetchFamilyMinCost()
      resetIngredientForm()
    } catch (error) {
      setErrors({ ...errors, ingredient: error.message })
    }
  }

  // Family Menu Generate (calls backend combo generator)
  async function handleFamilySubmit(event) {
    event.preventDefault()
    setErrors({ ...errors, family: '' })

    try {
      await generateFamilyMenuAction({
        familySize: Number(familyForm.familySize),
        weeklyBudget: Number(familyForm.weeklyBudget),
        userId: user?.userId || undefined
      })
    } catch (error) {
      setErrors({ ...errors, family: error.message })
    }
  }

  // Save Family Menu Result
  function handleSaveFamilyMenu() {
    if (!user?.userId) {
      setNotice({ tone: 'info', message: t('notice_sign_in_family') })
      return false
    }

    if (!familyMenu) {
      setErrors({ ...errors, family: t('err_gen_family_first') })
      return false
    }

    setNotice({ tone: 'success', message: t('notice_family_saved') })
    return true
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
    adminUsersOverview: auth.adminOverview.users,
    registeredUsersCount: auth.adminOverview.registeredUsersCount,
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
    errors: combinedErrors,
    loading: combinedLoading,
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
    handleReplaceMeal,
    handleSaveFamilyMenu,
    handleSavePlan,
    handleIngredientSubmit,
    handleFamilySubmit,
    refreshPricing: fetchFamilyMinCost,
    refreshMeals: fetchMeals,
    refreshIngredients: fetchIngredients,
    language,
    setLanguage,
    t,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function AppProvider({ children }) {
  return (
    <Provider store={store}>
      <InnerAppProvider>{children}</InnerAppProvider>
    </Provider>
  )
}
