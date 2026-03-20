import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { dayOptions } from '../constants/appData'
import MealCard from '../components/cards/MealCard'
import EmptyState from '../components/ui/EmptyState'
import Notice from '../components/ui/Notice'
import SectionHeading from '../components/ui/SectionHeading'
import { useAppContext } from '../hooks/useAppContext'
import { formatCurrency, formatNumber, getDayLabel } from '../utils/formatters'

function HistoryPage() {
  const {
    adminUsersOverview,
    errors,
    historyCalories,
    historyDay,
    historyMeals,
    isAdmin,
    loading,
    refreshAdminOverview,
    savedDays,
    setHistoryDay,
    shoppingList,
    user,
  } = useAppContext()
  const [adminSearch, setAdminSearch] = useState('')
  const [familyFilter, setFamilyFilter] = useState('all')
  const [bmiFilter, setBmiFilter] = useState('all')
  const adminWeekDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ]
  const filteredAdminUsers = useMemo(() => {
    const searchTerm = adminSearch.trim().toLowerCase()

    return adminUsersOverview.filter((item) => {
      const matchesSearch = !searchTerm || item.email.toLowerCase().includes(searchTerm)
      const matchesFamily =
        familyFilter === 'all' ||
        (familyFilter === 'yes' && item.hasFamilyMenu) ||
        (familyFilter === 'no' && !item.hasFamilyMenu)
      const matchesBmi =
        bmiFilter === 'all' ||
        (bmiFilter === 'yes' && Boolean(item.bmi)) ||
        (bmiFilter === 'no' && !item.bmi)

      return matchesSearch && matchesFamily && matchesBmi
    })
  }, [adminSearch, adminUsersOverview, bmiFilter, familyFilter])

  if (!user) {
    return (
      <section className="panel panel--full">
        <SectionHeading
          eyebrow="Meal history"
          title="Meal history requires a session"
          description=""
        />

        <EmptyState
          title="Sign in to open this page"
          description="After signing in, you can safely view saved meal days and shopping lists for your account."
          action={
            <Link className="primary-button" to="/auth">
              Go to sign in
            </Link>
          }
        />
      </section>
    )
  }

  if (isAdmin) {
    return (
      <section className="panel panel--full">
        <SectionHeading
          eyebrow="Admin user management"
          title="Registered user management"
          description=""
          actions={
            <button className="ghost-button" type="button" onClick={refreshAdminOverview}>
              Refresh data
            </button>
          }
        />

        {errors.adminOverview ? <Notice tone="error">{errors.adminOverview}</Notice> : null}

        <div className="summary-band">
          <span>{loading.adminOverview ? 'Loading user overview...' : `Total registered users: ${adminUsersOverview.length}`}</span>
          <span>{filteredAdminUsers.length} users in current view</span>
          <span>{adminUsersOverview.filter((item) => item.hasFamilyMenu).length} users with family menu</span>
          <span>{adminUsersOverview.filter((item) => item.bmi).length} users with BMI</span>
          <span>Manual refresh</span>
        </div>

        <div className="admin-table-toolbar">
          <label className="field admin-table-toolbar__search">
            <span>Search by email</span>
            <input
              type="text"
              value={adminSearch}
              onChange={(event) => setAdminSearch(event.target.value)}
              placeholder="Search registered email"
            />
          </label>

          <label className="field">
            <span>Family menu</span>
            <select value={familyFilter} onChange={(event) => setFamilyFilter(event.target.value)}>
              <option value="all">All</option>
              <option value="yes">Has family menu</option>
              <option value="no">No family menu</option>
            </select>
          </label>

          <label className="field">
            <span>BMI</span>
            <select value={bmiFilter} onChange={(event) => setBmiFilter(event.target.value)}>
              <option value="all">All</option>
              <option value="yes">Has BMI</option>
              <option value="no">No BMI</option>
            </select>
          </label>
        </div>

        {filteredAdminUsers.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Registered</th>
                  <th>BMI</th>
                  <th>Family menu</th>
                  {adminWeekDays.map((day) => (
                    <th key={day.value}>{day.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAdminUsers.map((item) => (
                  <tr key={item.userId}>
                    <td>
                      <div className="admin-table__user-cell">
                        <span className="chip chip--accent">User</span>
                        <strong>{item.email}</strong>
                      </div>
                    </td>
                    <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : 'Unknown'}</td>
                    <td>
                      <span className="admin-table__badge">{item.bmi ? `BMI ${item.bmi}` : 'No BMI'}</span>
                    </td>
                    <td>
                      <span className="admin-table__badge">
                        {item.hasFamilyMenu ? 'Selected' : 'Not selected'}
                      </span>
                    </td>
                    {adminWeekDays.map((day) => {
                      const selectedMeals = item.weekMeals?.[day.value] || []

                      return (
                        <td key={`${item.userId}-${day.value}`}>
                          <div className="admin-table__day-cell">
                            {selectedMeals.length ? (
                              selectedMeals.map((mealName) => (
                                <span className="admin-table__meal-pill" key={`${item.userId}-${day.value}-${mealName}`}>
                                  {mealName}
                                </span>
                              ))
                            ) : (
                              <span className="admin-table__empty">No meals</span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={adminUsersOverview.length ? 'No users match the current filters' : 'No registered users yet'}
            description={
              adminUsersOverview.length
                ? 'Try clearing the search box or switching the family menu and BMI filters.'
                : 'When regular users sign up and use the planner, this page will show their weekly selections for admin monitoring.'
            }
          />
        )}
      </section>
    )
  }

  return (
    <section className="panel panel--full">
      <SectionHeading
        eyebrow="Meal history"
        title="Saved meal history and shopping list by day"
        description=""
      />

      <div className="history-layout gap-6 xl:grid xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <div className="panel-stack tw-surface-soft p-5 md:p-6">
          <div className="day-chip-row">
            {dayOptions.map((day) => (
              <button
                key={day.value}
                className={historyDay === day.value ? 'day-chip is-active' : 'day-chip'}
                type="button"
                onClick={() => setHistoryDay(day.value)}
              >
                {day.label}
                {savedDays.has(day.value) ? <span className="day-chip__dot" /> : null}
              </button>
            ))}
          </div>

          {errors.historyOverview ? <Notice tone="error">{errors.historyOverview}</Notice> : null}
          {errors.historyDay ? <Notice tone="error">{errors.historyDay}</Notice> : null}

          <div className="summary-band">
            <span>{loading.history ? 'Loading daily data...' : `Viewing day: ${getDayLabel(historyDay)}`}</span>
            <span>{historyMeals.length} saved meals</span>
            <span>{formatNumber(historyCalories)} kcal</span>
            <span>{shoppingList ? formatCurrency(shoppingList.totalPrice) : 'No shopping list yet'}</span>
          </div>

          {historyMeals.length ? (
            <div className="meal-card-grid meal-card-grid--history">
              {historyMeals.map((meal) => (
                <MealCard key={`${meal.caption}-${meal.name}`} caption={meal.caption} meal={meal} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No meals saved for this day"
              description="After creating a meal suggestion, save it into history so the shopping list can be generated for that day."
            />
          )}
        </div>

        <div className="panel-stack tw-surface-soft p-5 md:p-6">
          <div className="shopping-header">
            <div>
              <span className="chip chip--accent">Shopping list</span>
              <h3>Ingredients for {getDayLabel(historyDay)}</h3>
            </div>
            <strong>{shoppingList ? formatCurrency(shoppingList.totalPrice) : '--'}</strong>
          </div>

          {shoppingList?.ingredients?.length ? (
            <div className="shopping-grid">
              {shoppingList.ingredients.map((item) => (
                <article className="shopping-card" key={`${item.normalized}-${item.mealName}`}>
                  <div>
                    <span className="chip chip--outline">{item.mealType}</span>
                    <h4>{item.name}</h4>
                    <p>{item.mealName}</p>
                  </div>
                  <div className="shopping-card__meta">
                    <span>{item.category || 'Uncategorized'}</span>
                    <strong>{formatCurrency(item.price)}</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No shopping list yet"
              description="Save a meal plan for this day and SonE will generate the shopping list automatically."
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default HistoryPage
