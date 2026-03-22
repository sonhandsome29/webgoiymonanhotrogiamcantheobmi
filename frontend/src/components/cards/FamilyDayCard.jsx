import { useMemo, useState } from 'react'
import AppIcon from '../icons/AppIcon'
import { resolveImageUrl } from '../../lib/api'
import { formatCurrency, formatNumber } from '../../utils/formatters'

function FamilyDayCard({ averageDailyBudget, day }) {
  const dayLabelMap = {
    'Chủ nhật': 'Sunday',
    'Thứ 2': 'Monday',
    'Thứ 3': 'Tuesday',
    'Thứ 4': 'Wednesday',
    'Thứ 5': 'Thursday',
    'Thứ 6': 'Friday',
    'Thứ 7': 'Saturday',
  }

  const mealTypeMap = {
    'Bữa sáng': 'Breakfast',
    'Bữa trưa': 'Lunch',
    'Bữa tối': 'Dinner',
  }

  const mealAccentClassMap = {
    Breakfast: 'family-dish--breakfast',
    Lunch: 'family-dish--lunch',
    Dinner: 'family-dish--dinner',
  }

  const mealIconMap = {
    Breakfast: 'planner',
    Lunch: 'library',
    Dinner: 'spark',
  }

  const [expanded, setExpanded] = useState(false)

  const totalCalories = (day.meals || []).reduce((sum, item) => sum + (item.dish?.calories || 0), 0)
  const budgetState = useMemo(() => {
    if (!averageDailyBudget) return 'neutral'
    if (day.totalCost <= averageDailyBudget * 0.92) return 'under'
    if (day.totalCost <= averageDailyBudget * 1.02) return 'near'
    return 'over'
  }, [averageDailyBudget, day.totalCost])

  const budgetLabelMap = {
    under: 'Under budget',
    near: 'Near limit',
    over: 'Over limit',
    neutral: 'Budget check',
  }

  return (
    <article className="family-day-card tw-surface-soft tw-lift">
      <div className="family-day-card__top">
        <div>
          <h3>{dayLabelMap[day.dayKeyVi] || day.dayKeyVi}</h3>
          <p>{day.ingredientCount} planned dishes · {formatNumber(totalCalories)} kcal total</p>
        </div>
        <div className="text-right">
          <span className={`tw-chip family-budget-chip family-budget-chip--${budgetState}`}>{budgetLabelMap[budgetState]}</span>
          <strong className="mt-3 block text-xl text-sone-ink">{formatCurrency(day.totalCost)}</strong>
        </div>
      </div>

      <button className="ghost-button family-day-card__toggle" type="button" onClick={() => setExpanded((value) => !value)}>
        {expanded ? 'Hide meals' : 'Show meals'}
      </button>

      <div className={expanded ? 'family-day-card__stack family-day-card__stack--expanded' : 'family-day-card__stack family-day-card__stack--collapsed'}>
        {(day.meals || []).map((item, index) => (
          <div className={`family-dish rounded-[22px] border border-sone-line/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,243,233,0.82))] px-4 py-4 ${mealAccentClassMap[mealTypeMap[item.mealTypeVi] || item.mealTypeVi] || ''}`} key={`${day.dayKeyVi}-${item.dish?.mealId || index}`}>
            <div className="flex items-start gap-3">
              <div className="family-dish__thumb-wrap">
                {item.dish?.image_url ? (
                  <img
                    alt={item.dish?.name || 'Meal'}
                    className="family-dish__thumb"
                    src={resolveImageUrl(item.dish.image_url, item.dish.name, item.dish.group)}
                  />
                ) : (
                  <div className="family-dish__thumb family-dish__thumb--fallback">
                    <AppIcon name={mealIconMap[mealTypeMap[item.mealTypeVi] || item.mealTypeVi] || 'spark'} size={18} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
              <span className="family-dish__label">
                <AppIcon name={mealIconMap[mealTypeMap[item.mealTypeVi] || item.mealTypeVi] || 'spark'} size={14} />{' '}
                {mealTypeMap[item.mealTypeVi] || item.mealTypeVi}
              </span>
              <h4>{item.dish?.name || 'Meal'}</h4>
              </div>
            </div>
            <div className="family-dish__meta">
              <span>{formatNumber(item.dish?.calories)} kcal</span>
              <span>{formatCurrency(item.dish?.pricePerPerson)} / person</span>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

export default FamilyDayCard
