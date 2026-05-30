import { resolveImageUrl } from '../../lib/api'
import { formatNumber, getGroupLabel, makeInitials } from '../../utils/formatters'
import { useAppContext } from '../../hooks/useAppContext'

function MealCard({ meal, caption, onClick, actionLabel }) {
  const { language } = useAppContext()
  const imageSrc = resolveImageUrl(meal.image_url, meal.name, meal.group)
  const ingredientPreview = (meal.ingredients || []).slice(0, 4)
  const extraIngredients = Math.max((meal.ingredients || []).length - ingredientPreview.length, 0)
  const CardTag = onClick ? 'button' : 'article'
  const resolvedActionLabel = actionLabel || (language === 'vi' ? 'Xem chi tiết' : 'View details')

  return (
    <CardTag
      className="meal-card tw-surface tw-lift caustic-emerald gradient-border-card group h-full overflow-hidden"
      {...(onClick
        ? {
            type: 'button',
            onClick: () => onClick(meal),
          }
        : {})}
    >
      <div className="meal-card__visual relative overflow-hidden">
        <div className="visual-fallback">
          <span>{makeInitials(meal.name || 'M')}</span>
        </div>
        {imageSrc ? (
          <img
            className="meal-card__image transition duration-500 group-hover:scale-[1.03]"
            src={imageSrc}
            alt={meal.name}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : null}
      </div>

      <div className="meal-card__body flex flex-1 flex-col gap-4">
        <div className="meal-card__header">
          <span className="chip chip--outline">{caption || getGroupLabel(meal.group) || (language === 'vi' ? 'Món ăn' : 'Meal')}</span>
          <h3>{meal.name}</h3>
          <p>{meal.group ? (language === 'vi' ? `Nhóm: ${getGroupLabel(meal.group)}` : `Group: ${getGroupLabel(meal.group)}`) : (language === 'vi' ? 'Thông tin món ăn từ thư viện' : 'Meal information from the library')}</p>
        </div>

        <div className="macro-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.78rem', fontWeight: '700', textAlign: 'center' }}>
          <div style={{ flex: '1 1 calc(50% - 4px)', minWidth: '58px', padding: '6px 4px', borderRadius: '8px', background: 'var(--warm-soft)', color: 'var(--warm-deep)' }}>
            <div>{formatNumber(meal.calories)}</div>
            <div style={{ fontSize: '0.64rem', textTransform: 'uppercase', opacity: 0.8 }}>Kcal</div>
          </div>
          <div style={{ flex: '1 1 calc(50% - 4px)', minWidth: '58px', padding: '6px 4px', borderRadius: '8px', background: 'var(--accent-soft)', color: 'var(--accent-strong)' }}>
            <div>{formatNumber(meal.protein)}g</div>
            <div style={{ fontSize: '0.64rem', textTransform: 'uppercase', opacity: 0.8 }}>Pro</div>
          </div>
          <div style={{ flex: '1 1 calc(50% - 4px)', minWidth: '58px', padding: '6px 4px', borderRadius: '8px', background: 'var(--amber-soft)', color: 'var(--amber)' }}>
            <div>{formatNumber(meal.carbs)}g</div>
            <div style={{ fontSize: '0.64rem', textTransform: 'uppercase', opacity: 0.8 }}>Carb</div>
          </div>
          <div style={{ flex: '1 1 calc(50% - 4px)', minWidth: '58px', padding: '6px 4px', borderRadius: '8px', background: 'var(--paper-hover)', color: 'var(--ink-2)' }}>
            <div>{formatNumber(meal.fat)}g</div>
            <div style={{ fontSize: '0.64rem', textTransform: 'uppercase', opacity: 0.8 }}>Fat</div>
          </div>
        </div>

        {ingredientPreview.length ? (
          <div className="tag-row">
            {ingredientPreview.map((ingredient) => (
              <span className="tag" key={ingredient}>
                {ingredient}
              </span>
            ))}
            {extraIngredients ? <span className="tag">+{extraIngredients}</span> : null}
          </div>
        ) : null}

        {meal.instructions ? (
          <p className="meal-card__note mt-auto">
            {meal.instructions.length > 120
              ? `${meal.instructions.slice(0, 120)}...`
              : meal.instructions}
          </p>
        ) : null}

        {onClick ? <strong className="text-left text-sone-strong">{resolvedActionLabel}</strong> : null}
      </div>
    </CardTag>
  )
}

export default MealCard
