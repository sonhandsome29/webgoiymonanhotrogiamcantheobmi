import { Link } from 'react-router-dom'
import Notice from '../components/ui/Notice'
import SectionHeading from '../components/ui/SectionHeading'
import EmptyState from '../components/ui/EmptyState'
import FamilyDayCard from '../components/cards/FamilyDayCard'
import { useAppContext } from '../hooks/useAppContext'
import { formatCurrency } from '../utils/formatters'

function FamilyPage() {
  const {
    errors,
    familyForm,
    familyMenu,
    handleFamilySubmit,
    isAdmin,
    loading,
    minCost,
    recommendedFamilyBudget,
    refreshPricing,
    setFamilyForm,
    user,
  } = useAppContext()
  const hasBudgetInput = String(familyForm.weeklyBudget || '').trim() !== ''
  const averageDailyBudget = familyMenu ? Math.round(familyMenu.totalWeekCost / 7) : 0

  if (isAdmin) {
    return (
      <section className="panel panel--full">
        <SectionHeading
          eyebrow="Admin only"
          title="The family menu is hidden in admin mode"
          description="Family planning is intended for regular accounts, while admin mode focuses on data and moderation tasks."
        />

        <EmptyState
          title="This feature is hidden for admin"
          description="Open Users to see which registered accounts already selected a family menu."
        />
      </section>
    )
  }

  if (!user) {
    return (
      <section className="panel panel--full">
        <SectionHeading
          eyebrow="Family budget"
          title="Sign in to build a family menu"
          description="Guests can view the pricing baseline, but menu generation and household inputs are reserved for signed-in accounts."
          actions={
            <button className="ghost-button" type="button" onClick={refreshPricing}>
              Refresh pricing data
            </button>
          }
        />

        <div className="panel-stack tw-surface-soft p-5 md:p-6">
          {errors.familyMinCost ? <Notice tone="error">{errors.familyMinCost}</Notice> : null}

          <EmptyState
            title="Family planning is locked for guests"
            description="Sign in to enter family size, weekly budget, and generate a 7-day family menu based on your current ingredient pricing."
            action={
              <Link className="primary-button" to="/auth">
                Sign in to create a family menu
              </Link>
            }
          />

          {recommendedFamilyBudget ? (
            <p className="subtle-text">
              Example minimum for {familyForm.familySize} people: {formatCurrency(recommendedFamilyBudget)}.
            </p>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <section className="panel panel--full">
        <SectionHeading
          eyebrow="Family budget"
          title="Estimate the minimum budget and build a 7-day family menu"
          description="Use your current ingredient prices to generate a weekly menu that fits the size of your household."
          actions={
            <button className="ghost-button" type="button" onClick={refreshPricing}>
              Refresh pricing data
            </button>
          }
        />

      <div className="panel-stack tw-surface-soft p-5 md:p-6">
        {minCost && hasBudgetInput ? (
          <div className="highlight-card">
            <div className="highlight-card__top">
              <div>
                <span className="chip chip--accent">Minimum target</span>
                <h3>{formatCurrency(minCost.minCostPerPerson)}</h3>
                <p>per person / week, including a {formatCurrency(minCost.buffer)} buffer</p>
              </div>
              <div className="inline-stats">
                <span>{formatCurrency(minCost.dailyCostPerPerson)} / day</span>
                <span>{formatCurrency(minCost.baseWeeklyCostPerPerson)} / base week</span>
              </div>
            </div>

            <div className="tag-row">
              {(minCost.cheapestMeals || []).map((item) => (
                <span className="tag" key={item.name}>
                  {item.name}: {formatCurrency(item.cost)}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {errors.familyMinCost ? <Notice tone="error">{errors.familyMinCost}</Notice> : null}

        <form className="panel-stack" onSubmit={handleFamilySubmit}>
          <div className="field-grid">
            <label className="field">
              <span>Family size</span>
              <input
                type="number"
                min="1"
                value={familyForm.familySize}
                onChange={(event) =>
                  setFamilyForm((previous) => ({ ...previous, familySize: event.target.value }))
                }
                required
              />
            </label>

            <label className="field">
              <span>Weekly budget</span>
              <input
                type="number"
                min="0"
                value={familyForm.weeklyBudget}
                onChange={(event) =>
                  setFamilyForm((previous) => ({ ...previous, weeklyBudget: event.target.value }))
                }
                placeholder="Example 1500000"
                required
              />
            </label>
          </div>

          <div className="action-row">
            <button className="primary-button" type="submit" disabled={loading.family}>
              {loading.family ? 'Generating menu...' : 'Generate family menu'}
            </button>

            {familyMenu ? (
              <button className="ghost-button" type="submit" disabled={loading.family}>
                {loading.family ? 'Refreshing...' : 'Generate another family menu'}
              </button>
            ) : null}

            <button
              className="ghost-button"
              type="button"
              onClick={() =>
                setFamilyForm((previous) => ({
                  ...previous,
                  weeklyBudget: recommendedFamilyBudget
                    ? String(Math.round(recommendedFamilyBudget))
                    : previous.weeklyBudget,
                }))
              }
            >
              Use suggested budget
            </button>
          </div>

          {recommendedFamilyBudget ? (
            <p className="subtle-text">
              Suggested minimum for {familyForm.familySize} people: {formatCurrency(recommendedFamilyBudget)}.
            </p>
          ) : null}

          {!hasBudgetInput ? (
            <p className="subtle-text">Enter a weekly budget to see the minimum target and pricing guidance.</p>
          ) : null}
        </form>

        {errors.family ? <Notice tone="error">{errors.family}</Notice> : null}

        {familyMenu ? (
          <div className="panel-stack">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="tw-surface-soft p-4">
                <span className="text-sm font-semibold uppercase tracking-[0.08em] text-sone-muted">Weekly total</span>
                <strong className="mt-3 block font-heading text-2xl text-sone-ink">{formatCurrency(familyMenu.totalWeekCost)}</strong>
              </article>
              <article className="tw-surface-soft p-4">
                <span className="text-sm font-semibold uppercase tracking-[0.08em] text-sone-muted">Base meal cost</span>
                <strong className="mt-3 block font-heading text-2xl text-sone-ink">{formatCurrency(familyMenu.baseWeekCost)}</strong>
              </article>
              <article className="tw-surface-soft p-4">
                <span className="text-sm font-semibold uppercase tracking-[0.08em] text-sone-muted">Safety buffer</span>
                <strong className="mt-3 block font-heading text-2xl text-sone-ink">{formatCurrency(familyMenu.buffer)}</strong>
              </article>
              <article className="tw-surface-soft p-4">
                <span className="text-sm font-semibold uppercase tracking-[0.08em] text-sone-muted">Minimum budget</span>
                <strong className="mt-3 block font-heading text-2xl text-sone-ink">{formatCurrency(familyMenu.minBudgetForFamily)}</strong>
              </article>
            </div>

            <div className="rounded-[28px] border border-sone-line bg-[linear-gradient(135deg,rgba(255,248,239,0.96),rgba(244,250,246,0.95))] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="panel-stack">
                  <span className="tw-chip">Family result</span>
                  <h3 className="m-0">7-day meal plan for {familyMenu.familySize} people</h3>
                  <p className="m-0 text-sone-muted">
                    This plan spreads your budget across the week and keeps each day readable by meal type and per-person cost.
                  </p>
                </div>

                <div className="panel-stack text-right">
                  <strong className="text-2xl text-sone-ink">{formatCurrency(Math.round(familyMenu.totalWeekCost / 7))}</strong>
                  <span className="text-sm text-sone-muted">average per day</span>
                  <span className="text-sm text-sone-muted">
                    {Math.round(
                      (familyMenu.days || []).reduce(
                        (sum, day) =>
                          sum +
                          (day.meals || []).reduce((mealSum, item) => mealSum + (item.dish?.calories || 0), 0),
                        0,
                      ) / Math.max((familyMenu.days || []).length, 1),
                    )} kcal average
                  </span>
                </div>
              </div>
            </div>

            <div className="family-day-grid">
              {(familyMenu.days || []).map((day) => (
                <FamilyDayCard averageDailyBudget={averageDailyBudget} key={day.dayKeyVi} day={day} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
              title="No family menu yet"
              description="Enter family size and weekly budget to generate a full 7-day family menu."
            />
          )}
      </div>
    </section>
  )
}

export default FamilyPage
