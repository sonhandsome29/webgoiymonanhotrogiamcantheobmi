import { resolveImageUrl } from '../../lib/api'
import { formatNumber, getGroupLabel, makeInitials } from '../../utils/formatters'

function MealCard({ meal, caption, onClick, actionLabel = 'View details' }) {
  const imageSrc = resolveImageUrl(meal.image_url, meal.name, meal.group)
  const ingredientPreview = (meal.ingredients || []).slice(0, 4)
  const extraIngredients = Math.max((meal.ingredients || []).length - ingredientPreview.length, 0)
  const CardTag = onClick ? 'button' : 'article'

  return (
    <CardTag
      className="meal-card tw-surface tw-lift group h-full overflow-hidden"
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
          <span className="chip chip--outline">{caption || getGroupLabel(meal.group) || 'Meal'}</span>
          <h3>{meal.name}</h3>
          <p>{meal.group ? `Group: ${getGroupLabel(meal.group)}` : 'Meal information from the library'}</p>
        </div>

        <div className="macro-row">
          <span>{formatNumber(meal.calories)} kcal</span>
          <span>{formatNumber(meal.protein)}P</span>
          <span>{formatNumber(meal.carbs)}C</span>
          <span>{formatNumber(meal.fat)}F</span>
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

        {onClick ? <strong className="text-left text-sone-strong">{actionLabel}</strong> : null}
      </div>
    </CardTag>
  )
}

export default MealCard
