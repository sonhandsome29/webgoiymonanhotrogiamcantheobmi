const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const API_BASE_URL = rawBaseUrl.replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      (typeof data === 'object' && data?.message) ||
      (typeof data === 'object' && data?.error) ||
      (typeof data === 'string' && data) ||
      'Request failed.'

    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export function resolveImageUrl(imagePath) {
  if (!imagePath) return ''
  if (/^https?:\/\//i.test(imagePath)) return imagePath

  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  return `${API_BASE_URL}${encodeURI(normalizedPath)}`
}

export const api = {
  getCurrentUser() {
    return request('/auth/me')
  },

  suggestMeals(payload) {
    return request('/suggest-meals', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  register(payload) {
    return request('/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  login(payload) {
    return request('/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  logout() {
    return request('/logout', {
      method: 'POST',
    })
  },

  getMeals() {
    return request('/meals')
  },

  getAdminUsersOverview() {
    return request('/admin/users-overview')
  },

  createMeal(payload) {
    return request('/admin/meals', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateMeal(mealId, payload) {
    return request(`/admin/meals/${encodeURIComponent(mealId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  deleteMeal(mealId) {
    return request(`/admin/meals/${encodeURIComponent(mealId)}`, {
      method: 'DELETE',
    })
  },

  saveMealHistory(payload) {
    return request('/meal-history', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getMealHistoryDay(userId, day) {
    return request(`/meal-history/${encodeURIComponent(userId)}/${encodeURIComponent(day)}`)
  },

  getMealHistoryAll(userId) {
    return request(`/meal-history/${encodeURIComponent(userId)}`)
  },

  getShoppingList(userId, day) {
    return request(`/ingredients/${encodeURIComponent(userId)}/${encodeURIComponent(day)}`)
  },

  getIngredients() {
    return request('/ingredients')
  },

  upsertIngredient(payload) {
    return request('/ingredients', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  deleteIngredient(ingredientId) {
    return request(`/ingredients/${encodeURIComponent(ingredientId)}`, {
      method: 'DELETE',
    })
  },

  getFamilyMinCost() {
    return request('/family/min-cost')
  },

  generateFamilyMenu(payload) {
    return request('/family/menu', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
