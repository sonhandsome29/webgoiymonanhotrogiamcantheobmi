const STORAGE_KEYS = {
  session: 'sone_local_session',
  users: 'sone_local_users',
  plannerPlans: 'sone_local_planner_plans',
  mealHistory: 'sone_local_meal_history',
  familyMenus: 'sone_local_family_menus',
}

const ADMIN_EMAILS = String(import.meta.env.VITE_ADMIN_EMAILS || 'admin@example.com')
  .split(',')
  .map((email) => normalizeEmail(email))
  .filter(Boolean)

function readJson(key, fallback) {
  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? JSON.parse(rawValue) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase()
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function sanitizeUser(user) {
  if (!user) return null

  return {
    userId: user.userId,
    email: user.email,
    role: user.role || 'user',
    createdAt: user.createdAt || new Date().toISOString(),
    latestPlannerProfile: user.latestPlannerProfile || null,
  }
}

export function getStoredUsers() {
  return readJson(STORAGE_KEYS.users, [])
}

function saveUsers(users) {
  writeJson(STORAGE_KEYS.users, users)
}

export function getStoredSession() {
  const session = readJson(STORAGE_KEYS.session, null)
  return session?.user ? { user: sanitizeUser(session.user) } : null
}

export function setStoredSession(user) {
  writeJson(STORAGE_KEYS.session, { user: sanitizeUser(user) })
}

export function clearStoredSession() {
  window.localStorage.removeItem(STORAGE_KEYS.session)
}

export function registerLocalUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email)
  const trimmedPassword = String(password || '')

  if (!normalizedEmail || !trimmedPassword) {
    const error = new Error('Email and password are required.')
    error.status = 400
    throw error
  }

  const users = getStoredUsers()

  if (users.some((user) => user.email === normalizedEmail)) {
    const error = new Error('An account with this email already exists.')
    error.status = 400
    throw error
  }

  const user = {
    userId: createId(),
    email: normalizedEmail,
    password: trimmedPassword,
    role: ADMIN_EMAILS.includes(normalizedEmail) ? 'admin' : 'user',
    createdAt: new Date().toISOString(),
    latestPlannerProfile: null,
  }

  saveUsers([...users, user])
  setStoredSession(user)
  return sanitizeUser(user)
}

export function loginLocalUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email)
  const trimmedPassword = String(password || '')
  const user = getStoredUsers().find((item) => item.email === normalizedEmail)

  if (!user || user.password !== trimmedPassword) {
    const error = new Error('Incorrect email or password.')
    error.status = 401
    throw error
  }

  setStoredSession(user)
  return sanitizeUser(user)
}

export function updateStoredUserProfile(userId, updates) {
  const users = getStoredUsers()
  const nextUsers = users.map((user) => (user.userId === userId ? { ...user, ...updates } : user))
  saveUsers(nextUsers)

  const updatedUser = nextUsers.find((user) => user.userId === userId) || null
  const session = getStoredSession()

  if (session?.user?.userId === userId && updatedUser) {
    setStoredSession(updatedUser)
  }

  return sanitizeUser(updatedUser)
}

function readScopedMap(key) {
  return readJson(key, {})
}

function writeScopedMap(key, value) {
  writeJson(key, value)
}

export function getStoredPlannerPlan(userId) {
  const plannerPlans = readScopedMap(STORAGE_KEYS.plannerPlans)
  return plannerPlans[userId] || null
}

export function setStoredPlannerPlan(userId, plan) {
  const plannerPlans = readScopedMap(STORAGE_KEYS.plannerPlans)
  plannerPlans[userId] = plan
  writeScopedMap(STORAGE_KEYS.plannerPlans, plannerPlans)
}

export function clearStoredPlannerPlan(userId) {
  const plannerPlans = readScopedMap(STORAGE_KEYS.plannerPlans)
  delete plannerPlans[userId]
  writeScopedMap(STORAGE_KEYS.plannerPlans, plannerPlans)
}

export function getStoredMealHistory(userId) {
  const mealHistory = readScopedMap(STORAGE_KEYS.mealHistory)
  return Array.isArray(mealHistory[userId]) ? mealHistory[userId] : []
}

export function getStoredMealHistoryDay(userId, day) {
  return getStoredMealHistory(userId).find((entry) => entry.day === day) || null
}

export function saveStoredMealHistoryDay(userId, day, meals) {
  const mealHistory = readScopedMap(STORAGE_KEYS.mealHistory)
  const existing = Array.isArray(mealHistory[userId]) ? mealHistory[userId] : []
  const nextEntry = {
    userId,
    day,
    meals,
    dateAdded: new Date().toISOString(),
  }

  mealHistory[userId] = [...existing.filter((entry) => entry.day !== day), nextEntry].sort((left, right) =>
    String(left.day).localeCompare(String(right.day)),
  )

  writeScopedMap(STORAGE_KEYS.mealHistory, mealHistory)
  return nextEntry
}

export function getStoredFamilyMenu(userId) {
  const familyMenus = readScopedMap(STORAGE_KEYS.familyMenus)
  return familyMenus[userId] || null
}

export function setStoredFamilyMenu(userId, menu) {
  const familyMenus = readScopedMap(STORAGE_KEYS.familyMenus)
  familyMenus[userId] = menu
  writeScopedMap(STORAGE_KEYS.familyMenus, familyMenus)
}

export function getAdminOverviewLocal() {
  const users = getStoredUsers().filter((user) => user.role !== 'admin')
  const mealHistory = readScopedMap(STORAGE_KEYS.mealHistory)
  const familyMenus = readScopedMap(STORAGE_KEYS.familyMenus)
  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  return {
    registeredUsersCount: users.length,
    users: users.map((user) => ({
      userId: user.userId,
      email: user.email,
      createdAt: user.createdAt,
      bmi: user.latestPlannerProfile?.bmi || null,
      hasFamilyMenu: Boolean(familyMenus[user.userId]),
      weekMeals: weekDays.reduce((result, day) => {
        const history = (mealHistory[user.userId] || []).find((entry) => entry.day === day)
        result[day] = (history?.meals || []).map((meal) => meal.mealName)
        return result
      }, {}),
    })),
  }
}
