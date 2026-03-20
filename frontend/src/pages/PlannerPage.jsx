import { Link } from 'react-router-dom'
import { activityOptions, dayOptions } from '../constants/appData'
import MealCard from '../components/cards/MealCard'
import Notice from '../components/ui/Notice'
import EmptyState from '../components/ui/EmptyState'
import SectionHeading from '../components/ui/SectionHeading'
import { useAppContext } from '../hooks/useAppContext'
import { formatNumber } from '../utils/formatters'

function PlannerPage() {
  const {
    errors,
    handlePlannerSubmit,
    handleReplaceMeal,
    handleSavePlan,
    isAdmin,
    loading,
    mealPlan,
    plannerForm,
    resetPlannerForm,
    selectedSaveDay,
    setPlannerForm,
    setSelectedSaveDay,
    user,
  } = useAppContext()

  if (isAdmin) {
    return (
      <section className="panel panel--full">
        <SectionHeading
          eyebrow="Admin only"
          title="Admin does not use the meal planner"
          description=""
        />

        <EmptyState
          title="Planner is hidden for admin"
          description="Go to Meals to manage meal data, or open Users to monitor registered activity."
        />
      </section>
    )
  }

  if (!user) {
    return (
      <section className="panel panel--full">
        <SectionHeading
          eyebrow="Meal planner"
          title="Sign in to use the planner"
          description="Guests can browse the product, but personal calorie planning is available only after sign-in."
        />

        <EmptyState
          title="Planner is view-only for guests"
          description="Create an account or sign in to enter your body data, generate meal suggestions, and save days into your meal history."
          action={
            <Link className="primary-button" to="/auth">
              Sign in to start planning
            </Link>
          }
        />
      </section>
    )
  }

  return (
    <section className="panel panel--full">
        <SectionHeading
          eyebrow="Suggest meals"
          title="Suggest meals by calories and preferences"
          description=""
          actions={
            <div className="action-row">
              {mealPlan ? (
                <button className="ghost-button" type="submit" form="planner-form" disabled={loading.planner}>
                  {loading.planner ? 'Refreshing...' : 'Try another plan'}
                </button>
              ) : null}
              <button className="ghost-button" type="button" onClick={resetPlannerForm}>
                Reset preset
              </button>
            </div>
          }
        />

      <div className="planner-layout gap-6 xl:grid xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <form className="panel-stack tw-surface-soft p-5 md:p-6" id="planner-form" onSubmit={handlePlannerSubmit}>
          <div className="field-grid field-grid--wide">
            <label className="field">
              <span>Weight (kg)</span>
              <input
                type="number"
                min="1"
                value={plannerForm.weight}
                onChange={(event) =>
                  setPlannerForm((previous) => ({ ...previous, weight: event.target.value }))
                }
                required
              />
            </label>

            <label className="field">
              <span>Height (cm)</span>
              <input
                type="number"
                min="1"
                value={plannerForm.height}
                onChange={(event) =>
                  setPlannerForm((previous) => ({ ...previous, height: event.target.value }))
                }
                required
              />
            </label>

            <label className="field">
              <span>Age</span>
              <input
                type="number"
                min="1"
                value={plannerForm.age}
                onChange={(event) =>
                  setPlannerForm((previous) => ({ ...previous, age: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>Gender</span>
              <select
                value={plannerForm.gender}
                onChange={(event) =>
                  setPlannerForm((previous) => ({ ...previous, gender: event.target.value }))
                }
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </label>

            <label className="field">
              <span>Activity level</span>
              <select
                value={plannerForm.activity_level}
                onChange={(event) =>
                  setPlannerForm((previous) => ({ ...previous, activity_level: event.target.value }))
                }
              >
                {activityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Custom calorie target (optional)</span>
              <input
                type="number"
                min="0"
                value={plannerForm.overrideTargetCalories}
                onChange={(event) =>
                  setPlannerForm((previous) => ({
                    ...previous,
                    overrideTargetCalories: event.target.value,
                  }))
                }
                placeholder="Leave empty to auto-calculate"
              />
            </label>
          </div>

          <div className="field-grid field-grid--wide">
            <label className="field field--span-2">
              <span>Groups to avoid</span>
              <input
                type="text"
                value={plannerForm.dislikedGroups}
                onChange={(event) =>
                  setPlannerForm((previous) => ({
                    ...previous,
                    dislikedGroups: event.target.value,
                  }))
                }
                placeholder="Example: pork, yogurt"
              />
            </label>

            <label className="field field--span-2">
              <span>Ingredients to avoid</span>
              <input
                type="text"
                value={plannerForm.dislikedIngredients}
                onChange={(event) =>
                  setPlannerForm((previous) => ({
                    ...previous,
                    dislikedIngredients: event.target.value,
                  }))
                }
                placeholder="Example: garlic, scallion, mushroom"
              />
            </label>

            <label className="field field--span-2">
              <span>Specific meals to skip</span>
              <input
                type="text"
                value={plannerForm.dislikedMeals}
                onChange={(event) =>
                  setPlannerForm((previous) => ({
                    ...previous,
                    dislikedMeals: event.target.value,
                  }))
                }
                placeholder="Example: Pan-seared salmon, low-oil grilled bun cha"
              />
            </label>
          </div>

          {errors.planner ? <Notice tone="error">{errors.planner}</Notice> : null}

          <div className="action-row">
            <button className="primary-button" type="submit" disabled={loading.planner}>
              {loading.planner ? 'Calculating...' : 'Get meal suggestions'}
            </button>
            <Link className="ghost-button" to="/history">
              Open daily history
            </Link>
          </div>
        </form>

        <div className="panel-stack tw-surface-soft p-5 md:p-6">
          {mealPlan ? (
            <>
              <div className="summary-band">
                <span>Target: {formatNumber(mealPlan.targetCaloriesPerDay)} kcal</span>
                <span>Actual: {formatNumber(mealPlan.selectedCalories)} kcal</span>
                <span>BMI: {mealPlan.bmi}</span>
                <span>Goal: {mealPlan.goal}</span>
              </div>

              <div className="planner-save-bar">
                <label className="field field--compact">
                  <span>Save to day</span>
                  <select value={selectedSaveDay} onChange={(event) => setSelectedSaveDay(event.target.value)}>
                    {dayOptions.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  className="primary-button"
                  type="button"
                  onClick={handleSavePlan}
                  disabled={loading.savePlan}
                >
                  {loading.savePlan ? 'Saving...' : 'Save to history'}
                </button>
              </div>

              <div className="meal-section-grid">
                {(mealPlan.meals || []).map((section) => (
                  <div className="meal-section" key={section.meal}>
                    <div className="meal-section__header">
                      <h3>{section.meal}</h3>
                      <span>{(section.details || []).length} selected meals</span>
                    </div>

                    <div className="meal-card-grid">
                      {(section.details || []).map((meal) => (
                        <div className="panel-stack" key={meal._id}>
                          <MealCard caption={section.meal} meal={meal} />
                          <button className="ghost-button" type="button" onClick={() => handleReplaceMeal(section.meal, meal._id)}>
                            Replace this meal
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title="No meal plan yet"
              description="Enter your body data on the left and SonE will generate a day plan for breakfast, lunch, and dinner."
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default PlannerPage
