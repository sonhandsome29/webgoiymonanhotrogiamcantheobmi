import { Link } from 'react-router-dom'
import SectionHeading from '../components/ui/SectionHeading'
import { useAppContext } from '../hooks/useAppContext'
import { resolveImageUrl } from '../lib/api'
import { formatCurrency, formatNumber, getGroupLabel } from '../utils/formatters'

function OverviewPage() {
  const {
    adminUsersOverview,
    historyRecords,
    isAdmin,
    mealGroups,
    meals,
    minCost,
    recommendedFamilyBudget,
    savedDays,
    setMealQuery,
    user,
  } = useAppContext()

  const accountName = user ? user.email.split('@')[0] : 'guest'
  const personalizedMeals = meals.slice(0, 4)
  const editorialMeals = meals.slice(4, 7)
  const popularMeals = meals.slice(7, 13)
  const highlightedGroups = mealGroups
    .filter((group) => group !== 'cơm')
    .map((group) => {
      const groupMeals = meals.filter((meal) => meal.group === group)
      const cover = groupMeals.find((meal) => meal.image_url)

      return {
        group,
        count: groupMeals.length,
        cover,
        samples: groupMeals.slice(0, 2).map((meal) => meal.name),
      }
    })
    .filter((item) => item.cover)
    .slice(0, 6)

  return (
    <>
      <section className="panel panel--full home-personal-grid">
        <div className="home-personal-card">
          <SectionHeading
            eyebrow={isAdmin ? 'Admin mode' : user ? `For ${accountName}` : 'Start with SonE'}
            title={
              isAdmin
                ? 'A cleaner admin workspace for content and users'
                : user
                  ? 'A dashboard designed around your account'
                  : 'A healthier food routine, built around you'
            }
            description={
              isAdmin
                ? 'Admin sees the system from a management angle: user count, meal inventory, ingredient pricing, and quick paths into moderation flows.'
                : user
                  ? 'Your homepage now puts personal planning, saved history, and budget clarity in one place so each return feels familiar.'
                  : 'Search meals, build a planner, and turn daily eating into something easier to track and easier to keep.'
            }
          />

          <div className="home-personal-card__grid">
            <div className="home-kpi-card">
              <span>{isAdmin ? 'Registered users' : 'Saved days'}</span>
              <strong>{formatNumber(isAdmin ? adminUsersOverview.length : savedDays.size)}</strong>
              <p>
                {isAdmin
                  ? 'Total regular users currently registered in the system.'
                  : 'Days with real meal history attached to your account.'}
              </p>
            </div>
            <div className="home-kpi-card">
              <span>Meals available</span>
              <strong>{formatNumber(meals.length)}</strong>
              <p>A growing meal library you can search and reuse anytime.</p>
            </div>
            <div className="home-kpi-card">
              <span>{isAdmin ? 'Pricing baseline' : 'Weekly budget hint'}</span>
              <strong>
                {minCost
                  ? formatCurrency(recommendedFamilyBudget || minCost.minCostPerPerson)
                  : 'Updating...'}
              </strong>
              <p>
                {isAdmin
                  ? 'This pricing baseline helps admin review the system cost logic.'
                  : 'Budget guidance based on your current ingredient pricing data.'}
              </p>
            </div>
            <div className="home-kpi-card">
              <span>Account mode</span>
              <strong>{user ? (isAdmin ? 'Admin' : 'Personal') : 'Guest'}</strong>
              <p>
                {user
                  ? 'Your navigation and actions now adapt around your session.'
                  : 'Sign in to unlock personalized planning and saved history.'}
              </p>
            </div>
          </div>

          <div className="action-row">
            <Link className="primary-button" to={isAdmin ? '/history' : user ? '/planner' : '/auth'}>
              {isAdmin ? 'Manage registered users' : user ? 'Plan a new day' : 'Log in to personalize'}
            </Link>
            <Link className="ghost-button" to={isAdmin ? '/library' : user ? '/history' : '/library'}>
              {isAdmin ? 'Manage meals' : user ? 'Review your history' : 'Explore meal library'}
            </Link>
          </div>
        </div>

        <div className="home-editorial-card">
          <span className="eyebrow eyebrow--soft">{isAdmin ? 'Admin note' : 'A note from SonE'}</span>
          <h2>
            {isAdmin
              ? 'The admin view focuses on control, clarity, and clean operations.'
              : 'We are building a modern meal companion, not just a list of dishes.'}
          </h2>
          <p>
            {isAdmin
              ? 'Instead of showing personal planning and family actions, the admin homepage now emphasizes moderation: managing meals, checking registered users, and maintaining ingredient pricing with fewer distractions.'
              : 'SonE combines meal discovery, personal tracking, pricing insight, and family planning into one clear experience. Instead of jumping between separate tools, you can search a meal, add structure to your eating routine, and keep your decisions grounded in both nutrition and budget.'}
          </p>
          <p>
            {isAdmin
              ? 'That keeps the admin role aligned with system maintenance rather than user consumption. Personal meal planning, family budget creation, and daily routine features stay reserved for regular accounts.'
              : 'That makes the product feel more personal for each account. A returning user sees their own saved rhythm. An admin sees where pricing control matters. A family-focused user gets budget-aware planning. The interface becomes less generic and more reflective of how each person actually uses food data day to day.'}
          </p>
        </div>
      </section>

      <section className="panel panel--full">
        <SectionHeading
          eyebrow="Browse by mood"
          title={`We already have ${formatNumber(meals.length)} meals across ${formatNumber(mealGroups.length)} diverse groups`}
          description="Each collection opens a cleaner view into SonE's meal diversity, with a few real dishes surfaced so users understand what each shelf actually contains."
        />

        <div className="home-collections-grid">
          {highlightedGroups.map((item) => (
            <Link
              className="collection-card"
              key={item.group}
              to={`/library?group=${encodeURIComponent(item.group)}`}
              onClick={() => setMealQuery('')}
            >
              <div className="collection-card__image-wrap">
                <img
                  alt={item.group}
                  className="collection-card__image"
                  src={resolveImageUrl(item.cover?.image_url, item.cover?.name || item.group, item.group)}
                />
              </div>
              <div className="collection-card__content">
                <span className="chip chip--outline">{item.count} meals</span>
                <h3>{getGroupLabel(item.group)}</h3>
                <p>
                  Example meals: {item.samples[0] || 'Sample meal'}
                  {item.samples[1] ? `, ${item.samples[1]}` : ''}.
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel panel--full home-feature-layout">
        <div className="home-feature-main">
          <SectionHeading
            eyebrow="Personal picks"
            title={user ? `Fresh choices for ${accountName}` : 'Fresh choices to start your week'}
            description="A tighter visual feed that makes the homepage feel alive, useful, and worth coming back to."
          />

          <div className="home-meal-grid">
            {personalizedMeals.map((meal) => (
                <Link
                  className="home-meal-card"
                  key={meal._id || meal.name}
                  to={`/library?meal=${encodeURIComponent(meal._id || meal.name)}&search=${encodeURIComponent(meal.name)}`}
                  onClick={() => setMealQuery(meal.name)}
                >
                  <div className="home-meal-card__image-wrap">
                  <img alt={meal.name} className="home-meal-card__image" src={resolveImageUrl(meal.image_url, meal.name, meal.group)} />
                  </div>
                <div className="home-meal-card__body">
                  <span className="chip chip--outline">{getGroupLabel(meal.group)}</span>
                  <h3>{meal.name}</h3>
                  <p>{meal.instructions}</p>
                  <div className="home-meal-card__meta">
                    <span>{meal.calories || 0} kcal</span>
                    <strong>Open meal</strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="home-feature-side">
          <span className="eyebrow eyebrow--soft">Trending inside SonE</span>
          {editorialMeals.map((meal, index) => (
            <Link
              className="story-mini-card"
              key={meal._id || meal.name}
              to={`/library?meal=${encodeURIComponent(meal._id || meal.name)}&search=${encodeURIComponent(meal.name)}`}
              onClick={() => setMealQuery(meal.name)}
            >
              <div className="story-mini-card__text">
                <span>Story {index + 1}</span>
                <h3>{meal.name}</h3>
                <p>{getGroupLabel(meal.group)} meal with {meal.calories || 0} kcal and a strong visual identity.</p>
              </div>
              <img alt={meal.name} className="story-mini-card__image" src={resolveImageUrl(meal.image_url, meal.name, meal.group)} />
            </Link>
          ))}
        </aside>
      </section>

      <section className="panel panel--full">
        <SectionHeading
          eyebrow="Most popular this week"
          title="A wider rail of meals people would actually want to revisit"
          description="This section gives your homepage a more modern, product-led rhythm instead of looking like a static admin page."
        />

        <div className="popular-rail">
          {popularMeals.map((meal) => (
            <Link
              className="popular-rail__card"
              key={meal._id || meal.name}
              to={`/library?meal=${encodeURIComponent(meal._id || meal.name)}&search=${encodeURIComponent(meal.name)}`}
              onClick={() => setMealQuery(meal.name)}
            >
              <img alt={meal.name} className="popular-rail__image" src={resolveImageUrl(meal.image_url, meal.name, meal.group)} />
              <div className="popular-rail__content">
                <h3>{meal.name}</h3>
                <p>{getGroupLabel(meal.group)}</p>
                <div className="popular-rail__meta">
                  <span>{meal.calories || 0} kcal</span>
                  <span>{meal.protein || 0}g protein</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {isAdmin ? null : (
        <section className="panel panel--full newsletter-panel">
          <div className="newsletter-panel__copy">
            <span className="eyebrow eyebrow--soft">Stay close to your progress</span>
            <h2>Keep SonE feeling personal, practical, and consistent every week.</h2>
            <p>
              {user
                ? `${user.email} currently has ${historyRecords.length} saved meal plans. Come back often to refine your planner, compare your history, and keep your food budget more intentional.`
                : 'Create an account to save your meal rhythm, revisit your favorite dishes, and make the homepage feel tailored to you instead of generic to everyone.'}
            </p>
          </div>

          <div className="newsletter-panel__actions">
            <Link className="primary-button" to={user ? '/planner' : '/auth'}>
              {user ? 'Continue with planner' : 'Create your account'}
            </Link>
            <Link className="ghost-button" to="/family">
              Open family budget
            </Link>
          </div>
        </section>
      )}
    </>
  )
}

export default OverviewPage
