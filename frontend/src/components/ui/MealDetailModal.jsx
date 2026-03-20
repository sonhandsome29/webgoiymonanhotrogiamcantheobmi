import Notice from './Notice'
import { resolveImageUrl } from '../../lib/api'
import { formatNumber, getGroupLabel } from '../../utils/formatters'

function MealDetailModal({ meal, onClose }) {
  if (!meal) return null

  const imageSrc = resolveImageUrl(meal.image_url, meal.name, meal.group)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={onClose} role="presentation">
      <div className="tw-surface max-h-[90vh] w-full max-w-3xl overflow-auto p-5 md:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4 rounded-[24px] border border-sone-line bg-[linear-gradient(135deg,rgba(255,248,239,0.95),rgba(244,250,246,0.95))] p-5">
          <div>
            <span className="chip chip--accent">{getGroupLabel(meal.group) || 'Meal'}</span>
            <h2 className="mt-3">{meal.name}</h2>
            <p className="subtle-text">Full meal details, ingredients, preparation steps, and nutrition overview.</p>
            <div className="macro-row mt-4">
              <span>{formatNumber(meal.calories)} kcal</span>
              <span>{formatNumber(meal.protein)}P</span>
              <span>{formatNumber(meal.carbs)}C</span>
              <span>{formatNumber(meal.fat)}F</span>
            </div>
          </div>

          <button className="ghost-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-[320px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-[28px] border border-sone-line bg-white/70">
            {imageSrc ? (
              <img alt={meal.name} className="block h-full min-h-[280px] w-full object-cover" src={imageSrc} />
            ) : (
              <Notice tone="info">No local image found for this meal yet.</Notice>
            )}
          </div>

          <div className="panel-stack">
            <div className="rounded-[22px] border border-sone-line bg-white/65 p-4">
              <h3>Instructions</h3>
              <p className="m-0">{meal.instructions || 'No instructions saved for this meal.'}</p>
            </div>

            <div className="rounded-[22px] border border-sone-line bg-white/65 p-4">
              <h3>Ingredients</h3>
              <div className="tag-row">
                {(meal.ingredients || []).length
                  ? meal.ingredients.map((ingredient) => (
                      <span className="tag" key={ingredient}>
                        {ingredient}
                      </span>
                    ))
                  : <span className="tag">No ingredients listed</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MealDetailModal
