import Notice from '../components/ui/Notice'
import SectionHeading from '../components/ui/SectionHeading'
import { useAppContext } from '../hooks/useAppContext'
import { api } from '../lib/api'
import { formatCurrency } from '../utils/formatters'
import { useState } from 'react'

function PricingPage() {
  const [deleteError, setDeleteError] = useState('')
  const {
    errors,
    filteredIngredients,
    handleIngredientSubmit,
    ingredientForm,
    ingredientQuery,
    isAdmin,
    loading,
    refreshPricing,
    resetIngredientForm,
    setIngredientForm,
    setIngredientQuery,
  } = useAppContext()

  async function handleDeleteIngredient(ingredientId) {
    try {
      setDeleteError('')
      await api.deleteIngredient(ingredientId)
      await refreshPricing()
    } catch (error) {
      setDeleteError(error.message)
    }
  }

  return (
    <>
      {isAdmin ? (
        <section className="panel panel--half">
          <SectionHeading
            eyebrow="Ingredient pricing"
            title="Update ingredient pricing"
            description="Keep ingredient costs current so meal plans and family budgets reflect real pricing."
          />

          <form className="panel-stack" onSubmit={handleIngredientSubmit}>
            <div className="field-grid field-grid--wide">
              <label className="field field--span-2">
                <span>Ingredient name</span>
                <input
                  type="text"
                  value={ingredientForm.name}
                  onChange={(event) =>
                    setIngredientForm((previous) => ({ ...previous, name: event.target.value }))
                  }
                  placeholder="Example: chicken breast"
                  required
                />
              </label>

              <label className="field">
                <span>Price</span>
                <input
                  type="number"
                  min="0"
                  value={ingredientForm.price}
                  onChange={(event) =>
                    setIngredientForm((previous) => ({ ...previous, price: event.target.value }))
                  }
                  placeholder="Example 120000"
                />
              </label>

              <label className="field">
                <span>Unit</span>
                <input
                  type="text"
                  value={ingredientForm.unit}
                  onChange={(event) =>
                    setIngredientForm((previous) => ({ ...previous, unit: event.target.value }))
                  }
                  placeholder="kg, 100g, bunch, box"
                />
              </label>

              <label className="field">
                <span>Category</span>
                <input
                  type="text"
                  value={ingredientForm.category}
                  onChange={(event) =>
                    setIngredientForm((previous) => ({ ...previous, category: event.target.value }))
                  }
                  placeholder="meat, vegetables, seasoning"
                />
              </label>

              <label className="field field--span-2">
                <span>Image URL (optional)</span>
                <input
                  type="text"
                  value={ingredientForm.image_url}
                  onChange={(event) =>
                    setIngredientForm((previous) => ({ ...previous, image_url: event.target.value }))
                  }
                  placeholder="/images/uc-ga.jpg"
                />
              </label>
            </div>

            {errors.ingredient ? <Notice tone="error">{errors.ingredient}</Notice> : null}

            <div className="action-row">
              <button className="primary-button" type="submit" disabled={loading.ingredient}>
                {loading.ingredient ? 'Saving price...' : 'Save / update price'}
              </button>
              <button className="ghost-button" type="button" onClick={resetIngredientForm}>
                Clear form
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className={isAdmin ? 'panel panel--half' : 'panel panel--full'}>
        <SectionHeading
          eyebrow="Ingredient list"
          title="Current ingredient pricing"
          description={isAdmin ? 'Review the current inventory while updating items on the left.' : 'Browse the latest ingredient prices used across planning and budget features.'}
        />

        <div className="panel-stack">
          {deleteError ? <Notice tone="error">{deleteError}</Notice> : null}
          <label className="field">
            <span>Quick ingredient search</span>
            <input
              type="text"
              value={ingredientQuery}
              onChange={(event) => setIngredientQuery(event.target.value)}
              placeholder="Search by name, category, or unit"
            />
          </label>

          <div className="ingredient-list">
            {filteredIngredients.map((ingredient) => (
              <article className="ingredient-row" key={ingredient._id || ingredient.name}>
                <div>
                  <h3>{ingredient.name}</h3>
                  <p>{ingredient.category || 'Uncategorized'}</p>
                </div>
                <div className="ingredient-row__meta">
                  <span>{ingredient.unit || 'kg'}</span>
                  <strong>{formatCurrency(ingredient.price)}</strong>
                  {isAdmin && ingredient._id ? (
                    <button className="ghost-button" type="button" onClick={() => handleDeleteIngredient(ingredient._id)}>
                      Delete
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default PricingPage
