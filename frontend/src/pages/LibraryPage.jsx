import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MealCard from '../components/cards/MealCard'
import Notice from '../components/ui/Notice'
import SectionHeading from '../components/ui/SectionHeading'
import { useAppContext } from '../hooks/useAppContext'
import { api } from '../lib/api'
import { formatNumber, getGroupLabel } from '../utils/formatters'

const initialMealForm = {
  name: '',
  group: '',
  calories: '',
  protein: '',
  fat: '',
  carbs: '',
  image_url: '',
  instructions: '',
  ingredients: '',
}

function LibraryPage() {
  const [searchParams] = useSearchParams()
  const {
    filteredMeals,
    isAdmin,
    mealGroup,
    mealGroups,
    mealQuery,
    meals,
    refreshMeals,
    setMealGroup,
    setMealQuery,
  } = useAppContext()
  const [mealForm, setMealForm] = useState(initialMealForm)
  const [mealActionError, setMealActionError] = useState('')
  const [mealActionLoading, setMealActionLoading] = useState(false)
  const [editingMealId, setEditingMealId] = useState('')

  useEffect(() => {
    const searchValue = searchParams.get('search') || ''
    setMealQuery(searchValue)
  }, [searchParams, setMealQuery])

  const adminPreviewMeals = useMemo(() => filteredMeals.slice(0, 12), [filteredMeals])

  function handleMealFormChange(field, value) {
    setMealForm((previous) => ({ ...previous, [field]: value }))
  }

  function handleEditMeal(meal) {
    setEditingMealId(meal._id)
    setMealForm({
      name: meal.name || '',
      group: meal.group || '',
      calories: String(meal.calories || ''),
      protein: String(meal.protein || ''),
      fat: String(meal.fat || ''),
      carbs: String(meal.carbs || ''),
      image_url: meal.image_url || '',
      instructions: meal.instructions || '',
      ingredients: (meal.ingredients || []).join('\n'),
    })
  }

  function resetMealForm() {
    setEditingMealId('')
    setMealForm(initialMealForm)
    setMealActionError('')
  }

  async function handleMealSubmit(event) {
    event.preventDefault()
    setMealActionLoading(true)
    setMealActionError('')

    const payload = {
      ...mealForm,
      calories: Number(mealForm.calories) || 0,
      protein: Number(mealForm.protein) || 0,
      fat: Number(mealForm.fat) || 0,
      carbs: Number(mealForm.carbs) || 0,
      ingredients: mealForm.ingredients
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    }

    try {
      if (editingMealId) {
        await api.updateMeal(editingMealId, payload)
      } else {
        await api.createMeal(payload)
      }

      await refreshMeals()
      resetMealForm()
    } catch (error) {
      setMealActionError(error.message)
    } finally {
      setMealActionLoading(false)
    }
  }

  async function handleDeleteMeal(mealId) {
    setMealActionLoading(true)
    setMealActionError('')

    try {
      await api.deleteMeal(mealId)
      await refreshMeals()

      if (editingMealId === mealId) {
        resetMealForm()
      }
    } catch (error) {
      setMealActionError(error.message)
    } finally {
      setMealActionLoading(false)
    }
  }

  if (isAdmin) {
    return (
      <>
        <section className="panel panel--half">
          <SectionHeading
            eyebrow="Meal management"
            title={editingMealId ? 'Edit meal' : 'Create a new meal'}
            description="Keep the catalog accurate so planner, history, and family-budget features stay useful."
          />

          <form className="panel-stack" onSubmit={handleMealSubmit}>
            <div className="field-grid field-grid--wide">
              <label className="field field--span-2">
                <span>Meal name</span>
                <input type="text" value={mealForm.name} onChange={(event) => handleMealFormChange('name', event.target.value)} required />
              </label>

              <label className="field">
                <span>Meal group</span>
                <input type="text" value={mealForm.group} onChange={(event) => handleMealFormChange('group', event.target.value)} required />
              </label>

              <label className="field">
                <span>Calories</span>
                <input type="number" value={mealForm.calories} onChange={(event) => handleMealFormChange('calories', event.target.value)} />
              </label>

              <label className="field">
                <span>Protein</span>
                <input type="number" value={mealForm.protein} onChange={(event) => handleMealFormChange('protein', event.target.value)} />
              </label>

              <label className="field">
                <span>Fat</span>
                <input type="number" value={mealForm.fat} onChange={(event) => handleMealFormChange('fat', event.target.value)} />
              </label>

              <label className="field">
                <span>Carbs</span>
                <input type="number" value={mealForm.carbs} onChange={(event) => handleMealFormChange('carbs', event.target.value)} />
              </label>

              <label className="field field--span-2">
                <span>Image URL</span>
                <input type="text" value={mealForm.image_url} onChange={(event) => handleMealFormChange('image_url', event.target.value)} />
              </label>

              <label className="field field--span-2">
                <span>Instructions</span>
                <textarea rows="4" value={mealForm.instructions} onChange={(event) => handleMealFormChange('instructions', event.target.value)} />
              </label>

              <label className="field field--span-2">
                <span>Ingredients (one item per line)</span>
                <textarea rows="6" value={mealForm.ingredients} onChange={(event) => handleMealFormChange('ingredients', event.target.value)} />
              </label>
            </div>

            {mealActionError ? <Notice tone="error">{mealActionError}</Notice> : null}

            <div className="action-row">
              <button className="primary-button" disabled={mealActionLoading} type="submit">
                {mealActionLoading ? 'Saving...' : editingMealId ? 'Update meal' : 'Create meal'}
              </button>
              <button className="ghost-button" type="button" onClick={resetMealForm}>
                Reset form
              </button>
            </div>
          </form>
        </section>

        <section className="panel panel--half">
          <SectionHeading
            eyebrow="Meal inventory"
            title={`${formatNumber(meals.length)} meals currently in the system`}
            description="Search the current catalog, open a meal for editing, or remove entries that are no longer needed."
          />

          <div className="field-grid field-grid--wide">
            <label className="field field--span-2">
              <span>Quick meal search</span>
              <input type="text" value={mealQuery} onChange={(event) => setMealQuery(event.target.value)} placeholder="Search a meal to edit" />
            </label>

            <label className="field">
              <span>Meal group</span>
              <select value={mealGroup} onChange={(event) => setMealGroup(event.target.value)}>
                <option value="all">All</option>
                {mealGroups.map((group) => (
                  <option key={group} value={group}>
                    {getGroupLabel(group)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="ingredient-list admin-management-list">
            {adminPreviewMeals.map((meal) => (
              <article className="ingredient-row ingredient-row--admin" key={meal._id}>
                <div>
                  <h3>{meal.name}</h3>
                  <p>{getGroupLabel(meal.group) || 'No group'} · {meal.calories || 0} kcal</p>
                </div>
                <div className="ingredient-row__meta">
                  <button className="ghost-button" type="button" onClick={() => handleEditMeal(meal)}>
                    Edit
                  </button>
                  <button className="ghost-button" type="button" onClick={() => handleDeleteMeal(meal._id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </>
    )
  }

  return (
    <section className="panel panel--full">
      <SectionHeading
        eyebrow="Meal catalog"
        title="Browse the meal library"
        description="Search by name or group to find meals you want to plan, save, or compare later."
      />

      <div className="panel-stack">
        <div className="field-grid field-grid--wide">
          <label className="field field--span-2">
            <span>Search meals</span>
            <input
              type="text"
              value={mealQuery}
              onChange={(event) => setMealQuery(event.target.value)}
              placeholder="Example: grilled chicken, salad, yogurt"
            />
          </label>

          <label className="field">
            <span>Meal group</span>
            <select value={mealGroup} onChange={(event) => setMealGroup(event.target.value)}>
              <option value="all">All</option>
              {mealGroups.map((group) => (
                <option key={group} value={group}>
                    {getGroupLabel(group)}
                  </option>
                ))}
              </select>
          </label>
        </div>

        <p className="subtle-text">
          Showing {filteredMeals.length} meals after filtering out of {formatNumber(meals.length)} available meals.
        </p>

        <div className="meal-card-grid meal-card-grid--catalog">
          {filteredMeals.map((meal) => (
            <MealCard key={meal._id} caption={meal.group} meal={meal} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default LibraryPage
