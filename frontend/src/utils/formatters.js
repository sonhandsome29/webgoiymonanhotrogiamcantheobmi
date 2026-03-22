import { dayOptions } from '../constants/appData'

const groupLabelMap = {
  'bánh mì': 'Bread',
  'cá': 'Fish',
  'chay': 'Vegetarian',
  'cơm': 'Rice',
  'gà': 'Chicken',
  'hải sản': 'Seafood',
  'rau củ': 'Vegetables',
  'sữa bò': 'Milk',
  'sữa chua': 'Yogurt',
  'sữa hạt': 'Nut milk',
  'sữa yến mạch': 'Oat milk',
  'thịt bò': 'Beef',
  'thịt heo': 'Pork',
  'trái cây': 'Fruit',
  'yến mạch': 'Oats',
}

export function formatCurrency(value) {
  const amount = Number(value)

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatNumber(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? new Intl.NumberFormat('vi-VN').format(amount) : '--'
}

export function parseTagInput(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function parseOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) return undefined

  const amount = Number(value)
  return Number.isFinite(amount) ? amount : undefined
}

export function getDayLabel(dayValue) {
  return dayOptions.find((item) => item.value === dayValue)?.label || dayValue
}

export function makeInitials(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join('')
    .toUpperCase()
}

export function getGroupLabel(value) {
  return groupLabelMap[value] || value || 'Meal group'
}

export function resolveGroupKey(value) {
  const normalizedValue = normalizeSearchText(value)

  if (!normalizedValue) return value

  const entries = Object.entries(groupLabelMap)
  const exactMatch = entries.find(
    ([rawValue, label]) =>
      normalizeSearchText(rawValue) === normalizedValue || normalizeSearchText(label) === normalizedValue,
  )

  if (exactMatch) return exactMatch[0]

  const partialMatch = entries.find(
    ([rawValue, label]) =>
      normalizeSearchText(label).includes(normalizedValue) ||
      normalizedValue.includes(normalizeSearchText(label)) ||
      normalizeSearchText(rawValue).includes(normalizedValue),
  )

  return partialMatch ? partialMatch[0] : value
}

export function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

export function startsWithWord(value, query) {
  const normalizedValue = normalizeSearchText(value)
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) return false

  return normalizedValue
    .split(/\s+/)
    .filter(Boolean)
    .some((word) => word.startsWith(normalizedQuery))
}

export function maskEmail(email) {
  const normalizedEmail = String(email || '').trim()
  const [localPart, domainPart] = normalizedEmail.split('@')

  if (!localPart || !domainPart) return normalizedEmail
  if (localPart.length <= 2) return `${localPart[0] || '*'}*@${domainPart}`

  return `${localPart[0]}${'*'.repeat(Math.max(localPart.length - 2, 1))}${localPart.slice(-1)}@${domainPart}`
}
