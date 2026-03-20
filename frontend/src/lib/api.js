import imageManifest from '../data/imageManifest.json'
import { createLocalMeal, createOrUpdateLocalIngredient, deleteLocalIngredient, deleteLocalMeal, getLocalIngredients, getLocalMeals, updateLocalMeal } from './catalogData'
import { calculateFamilyMinCostLocal } from '../utils/familyMenuEngine'

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
  if (!imagePath && !fallbackName) return ''
  if (/^https?:\/\//i.test(imagePath)) return imagePath

  const normalizedPath = imagePath ? (imagePath.startsWith('/') ? imagePath : `/${imagePath}`) : ''
  const directFileName = decodeURIComponent(normalizedPath.split('/').pop() || '')
  const directMatch = imageLookup.get(normalizeAssetName(directFileName))

  if (directMatch) {
    return buildImageUrl(directMatch)
  }

  const fallbackMatch = imageLookup.get(normalizeAssetName(fallbackName))

  if (fallbackMatch) {
    return buildImageUrl(fallbackMatch)
  }

  const fuzzyMatch = findBestFuzzyImage(directFileName || fallbackName)

  if (fuzzyMatch) {
    return buildImageUrl(fuzzyMatch)
  }

  const groupFallback = groupFallbacks[normalizeAssetName(fallbackGroup)]

  if (groupFallback && imageLookup.get(normalizeAssetName(groupFallback))) {
    return buildImageUrl(groupFallback)
  }

  return ''
}

export const api = {
  async getMeals() {
    return getLocalMeals().slice().sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
  },

  async getIngredients() {
    return getLocalIngredients().slice().sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
  },

  async getFamilyMinCost() {
    return calculateFamilyMinCostLocal(getLocalMeals(), getLocalIngredients())
  },

  async createMeal(payload) {
    return { meal: createLocalMeal(payload), message: 'Meal created successfully' }
  },

  async updateMeal(mealId, payload) {
    const meal = updateLocalMeal(mealId, payload)

    if (!meal) {
      const error = new Error('Meal not found')
      error.status = 404
      throw error
    }

    return { meal, message: 'Meal updated successfully' }
  },

  async deleteMeal(mealId) {
    deleteLocalMeal(mealId)
    return { message: 'Meal deleted successfully' }
  },

  async upsertIngredient(payload) {
    return createOrUpdateLocalIngredient(payload)
  },

  async deleteIngredient(ingredientId) {
    deleteLocalIngredient(ingredientId)
    return { message: 'Ingredient deleted successfully' }
  },
}
