import imageManifest from '../data/imageManifest.json'
import { clearStoredSession, getStoredSession } from './session'

function normalizeAssetName(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokenizeAssetName(value = '') {
  return normalizeAssetName(value)
    .split(' ')
    .filter(Boolean)
}

const imageLookup = imageManifest.reduce((lookup, fileName) => {
  lookup.set(normalizeAssetName(fileName), fileName)
  return lookup
}, new Map())

const imageEntries = imageManifest.map((fileName) => ({
  fileName,
  normalized: normalizeAssetName(fileName),
  tokens: tokenizeAssetName(fileName),
}))

const groupFallbacks = {
  ga: 'Ức gà xào rau củ.jpg',
  ca: 'Phở gà ít bánh.jpg',
  'thit heo': 'Thịt heo nướng tỏi.jpg',
  'thit bo': 'Thịt bò áp chảo.jpg',
  'hai san': 'Tôm hấp lá dứa.jpg',
  chay: 'Đậu hũ hấp nấm.jpg',
  'trai cay': 'Táo.jpg',
  'sua chua': 'Sữa chua không đường.jpg',
  'banh mi': 'Bánh mì trứng ốp la.jpg',
  pho: 'Phở bò ít bánh.jpg',
  bun: 'Bún nước lèo cá.jpg',
  xoi: 'Xôi gà nướng.jpg',
  chao: 'Cháo gà ít gạo.jpg',
  com: 'Cơm gạo lứt.jpg',
  rau: 'Salad rau củ.jpg',
  'rau cu': 'Salad rau củ.jpg',
}

function buildImageUrl(fileName) {
  return `/images/${encodeURIComponent(fileName)}`
}

function findBestFuzzyImage(value = '') {
  const normalizedValue = normalizeAssetName(value)
  if (!normalizedValue) return null

  const exactContains = imageEntries.find(
    (entry) => entry.normalized.includes(normalizedValue) || normalizedValue.includes(entry.normalized),
  )

  if (exactContains) return exactContains.fileName

  const searchTokens = tokenizeAssetName(value)
  if (!searchTokens.length) return null

  let bestMatch = null
  let bestScore = 0

  imageEntries.forEach((entry) => {
    const score = searchTokens.reduce((sum, token) => sum + (entry.tokens.includes(token) ? 1 : 0), 0)

    if (score > bestScore) {
      bestScore = score
      bestMatch = entry.fileName
    }
  })

  return bestScore >= Math.max(2, Math.ceil(searchTokens.length / 2)) ? bestMatch : null
}

export function resolveImageUrl(imagePath, fallbackName = '', fallbackGroup = '') {
  let path = imagePath || ''
  let name = fallbackName || ''

  if (path.includes('+')) path = ''
  if (name.includes('+')) name = ''

  if (!path && !name) {
    const groupFallback = groupFallbacks[normalizeAssetName(fallbackGroup)]
    if (groupFallback && imageLookup.get(normalizeAssetName(groupFallback))) {
      return buildImageUrl(groupFallback)
    }
    return '/images/Salad%20rau%20c%E1%BB%A7.jpg'
  }

  if (/^https?:\/\//i.test(path)) return path

  const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : ''
  const directFileName = decodeURIComponent(normalizedPath.split('/').pop() || '')
  const directMatch = imageLookup.get(normalizeAssetName(directFileName))

  if (directMatch) {
    return buildImageUrl(directMatch)
  }

  const fallbackMatch = imageLookup.get(normalizeAssetName(name))

  if (fallbackMatch) {
    return buildImageUrl(fallbackMatch)
  }

  const fuzzyMatch = findBestFuzzyImage(directFileName || name)

  if (fuzzyMatch) {
    return buildImageUrl(fuzzyMatch)
  }

  const groupFallback = groupFallbacks[normalizeAssetName(fallbackGroup)]

  if (groupFallback && imageLookup.get(normalizeAssetName(groupFallback))) {
    return buildImageUrl(groupFallback)
  }

  return '/images/Salad%20rau%20c%E1%BB%A7.jpg'
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const session = getStoredSession()
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...options.headers,
  }
  const config = {
    ...options,
    headers,
  }
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }

  const response = await fetch(url, config)
  const rawText = await response.text()
  const data = rawText ? (() => {
    try {
      return JSON.parse(rawText)
    } catch {
      return rawText
    }
  })() : null

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredSession()
    }

    const errorMessage =
      data?.error?.message ||
      data?.error ||
      data?.message ||
      (typeof data === 'string' && data) ||
      'Something went wrong'
    const error = new Error(errorMessage)
    error.status = response.status
    error.code = data?.error?.code || null
    error.details = data?.error?.details || null
    throw error
  }

  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    return data.data
  }

  return data
}

export const api = {
  // Auth & Profile
  async register(payload) {
    return request('/register', { method: 'POST', body: payload })
  },
  
  async login(payload) {
    return request('/login', { method: 'POST', body: payload })
  },

  async getCurrentUser() {
    return request('/auth/me')
  },
  
  async updateProfile(userId, payload) {
    return request(`/users/${userId}/profile`, { method: 'PUT', body: payload })
  },

  // Meals
  async getMeals() {
    const meals = await request('/meals')
    return meals.slice().sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
  },

  async createMeal(payload) {
    return request('/meals', { method: 'POST', body: payload })
  },

  async updateMeal(mealId, payload) {
    return request(`/meals/${mealId}`, { method: 'PUT', body: payload })
  },

  async deleteMeal(mealId) {
    return request(`/meals/${mealId}`, { method: 'DELETE' })
  },

  // Ingredients
  async getIngredients() {
    const ingredients = await request('/ingredients')
    return ingredients.slice().sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
  },

  async upsertIngredient(payload) {
    return request('/ingredients', { method: 'POST', body: payload })
  },

  async deleteIngredient(ingredientId) {
    return request(`/ingredients/${ingredientId}`, { method: 'DELETE' })
  },

  // Family Menu & Budget
  async getFamilyMinCost() {
    return request('/family/min-cost')
  },

  async generateFamilyMenu(payload) {
    return request('/family/generate-menu', { method: 'POST', body: payload })
  },

  async getFamilyMenuHistory(userId) {
    return request(`/family/menu/${userId}`)
  },

  // Meal history
  async getMealHistory(userId) {
    return request(`/meal-history/${userId}`)
  },

  async getMealHistoryDay(userId, day) {
    try {
      return await request(`/meal-history/${userId}/${day}`)
    } catch (err) {
      if (err.status === 404) {
        return null
      }
      throw err
    }
  },

  async saveMealHistoryDay(userId, day, meals) {
    return request('/meal-history', { method: 'POST', body: { userId, day, meals } })
  },

  // Admin Dashboard
  async getAdminOverview() {
    return request('/admin/overview')
  },

  // Genetic Algorithm Suggestions
  async suggestMeals(payload) {
    return request('/suggest-meals', { method: 'POST', body: payload })
  }
}
