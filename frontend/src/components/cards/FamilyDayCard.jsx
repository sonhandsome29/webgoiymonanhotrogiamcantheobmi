import { formatCurrency, formatNumber } from '../../utils/formatters'

function FamilyDayCard({ day }) {
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

  return (
    <article className="family-day-card tw-surface-soft tw-lift">
      <div className="family-day-card__top">
        <div>
          <h3>{dayLabelMap[day.dayKeyVi] || day.dayKeyVi}</h3>
          <p>{day.ingredientCount} suggested ingredients</p>
        </div>
        <strong>{formatCurrency(day.totalCost)}</strong>
      </div>

      <div className="family-day-card__stack">
        {(day.meals || []).map((item, index) => (
          <div className="family-dish rounded-2xl border border-sone-line/70 bg-white/70 px-4 py-3" key={`${day.dayKeyVi}-${item.dish?.mealId || index}`}>
            <div>
              <span className="family-dish__label">{mealTypeMap[item.mealTypeVi] || item.mealTypeVi}</span>
              <h4>{item.dish?.name || 'Meal'}</h4>
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
