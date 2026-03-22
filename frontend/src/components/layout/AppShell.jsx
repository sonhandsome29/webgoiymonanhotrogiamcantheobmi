import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { resolveImageUrl } from '../../lib/api'
import { navItems } from '../../constants/appData'
import { useAppContext } from '../../hooks/useAppContext'
import { getGroupLabel, maskEmail, normalizeSearchText, startsWithWord } from '../../utils/formatters'
import AppIcon from '../icons/AppIcon'
import Notice from '../ui/Notice'

function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { clearNotice, errors, isAdmin, meals, notice, setMealQuery, summaryStats, user, handleLogout } = useAppContext()
  const searchValue = new URLSearchParams(location.search).get('search') || ''
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(searchValue)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const isHomePage = location.pathname === '/'
  const featuredMeal = meals[0] || null
  const spotlightMeals = meals.slice(1, 5)
  const accountName = user ? user.email.split('@')[0] : 'guest'
  const visibleNavItems = navItems
    .filter((item) => {
      if (!isAdmin) return true
      return item.to !== '/planner' && item.to !== '/family'
    })
    .map((item) => {
      if (!isAdmin) return item

      if (item.to === '/auth') return { ...item, label: 'Admin' }
      if (item.to === '/history') return { ...item, label: 'Users' }
      if (item.to === '/library') return { ...item, label: 'Meals' }
      if (item.to === '/pricing') return { ...item, label: 'Ingredients' }
      return item
    })

  useEffect(() => {
    setSearchInput(searchValue)
  }, [searchValue])

  const searchSuggestions = useMemo(() => {
    const query = normalizeSearchText(searchInput)

    if (!query) return []

    const groupSuggestions = [...new Set(meals.map((meal) => meal.group).filter(Boolean))]
        .filter(
          (group) =>
            startsWithWord(group, query) ||
            startsWithWord(getGroupLabel(group), query) ||
            normalizeSearchText(`${group} ${getGroupLabel(group)}`).includes(query),
        )
        .slice(0, 4)
        .map((group) => ({
          key: `group-${group}`,
          label: getGroupLabel(group),
          sublabel: `Group · ${getGroupLabel(group)}`,
          value: getGroupLabel(group),
        }))

    const mealSuggestions = meals
      .filter(
        (meal) =>
          startsWithWord(meal.name, query) ||
          startsWithWord(meal.group, query) ||
          startsWithWord(getGroupLabel(meal.group), query) ||
          normalizeSearchText(`${meal.name} ${meal.group} ${getGroupLabel(meal.group)}`).includes(query),
      )
      .slice(0, 8)
      .map((meal) => ({
        key: `meal-${meal._id || meal.name}`,
        label: meal.name,
        sublabel: `${getGroupLabel(meal.group)} · ${meal.calories || 0} kcal`,
        value: meal.name,
      }))

    return [...groupSuggestions, ...mealSuggestions].slice(0, 8)
  }, [meals, searchInput])

  function handleSearchNavigation(value) {
    const trimmedValue = String(value || '').trim()
    setShowSearchSuggestions(false)
    setMealQuery(trimmedValue)

    if (!trimmedValue) {
      navigate('/library')
      return
    }

    navigate(`/library?search=${encodeURIComponent(trimmedValue)}`)
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    const value = searchInput.trim()
    setMenuOpen(false)
    handleSearchNavigation(value)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link aria-label="SonE home" className="brand-mark" to="/">
          <span className="brand-mark__logo">S</span>
          <span className="brand-mark__text">SonE</span>
        </Link>

        <form key={`${location.pathname}-${location.search}`} className="header-search" onSubmit={handleSearchSubmit}>
          <AppIcon className="header-search__icon" name="search" size={18} />
          <input
            aria-label="Search meals"
            name="search"
            placeholder="Search your favorite meals..."
            type="search"
            value={searchInput}
            onBlur={() => {
              window.setTimeout(() => setShowSearchSuggestions(false), 120)
            }}
            onChange={(event) => {
              setSearchInput(event.target.value)
              setShowSearchSuggestions(true)
            }}
            onFocus={() => setShowSearchSuggestions(true)}
          />
          <button className="header-search__button" type="submit">
            Search
          </button>

          {showSearchSuggestions && searchSuggestions.length ? (
            <div className="header-search__suggestions">
              {searchSuggestions.map((item) => (
                <button
                  className="header-search__suggestion"
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setSearchInput(item.value)
                    handleSearchNavigation(item.value)
                  }}
                >
                  <span className="header-search__suggestion-title">{item.label}</span>
                  <span className="header-search__suggestion-subtitle">{item.sublabel}</span>
                </button>
              ))}
            </div>
          ) : null}
        </form>

        <div className="user-menu">
          <button
            aria-expanded={menuOpen}
            aria-label={user ? 'Open account menu' : 'Open sign-in menu'}
            className="user-menu__trigger"
            type="button"
            onClick={() => setMenuOpen((previous) => !previous)}
          >
            <span className="user-menu__avatar">
              <AppIcon name="auth" size={18} />
            </span>
            <span className="user-menu__meta">
              <strong>{user ? user.email.split('@')[0] : 'Guest'}</strong>
              <span>{user ? (isAdmin ? 'Admin account' : 'Personal account') : 'Sign in / Create account'}</span>
            </span>
          </button>

          {menuOpen ? (
            <div className="user-menu__panel">
              {user ? (
                <>
                  <div className="user-menu__summary">
                    <span className="chip chip--accent">{isAdmin ? 'Admin' : 'User'}</span>
                    <p>{maskEmail(user.email)}</p>
                  </div>
                  <Link className="user-menu__item" to="/auth" onClick={() => setMenuOpen(false)}>
                    <AppIcon name="settings" size={16} />
                    <span>{isAdmin ? 'Admin overview' : 'Profile'}</span>
                  </Link>
                  <Link className="user-menu__item" to="/history" onClick={() => setMenuOpen(false)}>
                    <AppIcon name="history" size={16} />
                    <span>{isAdmin ? 'User management' : 'Meal history'}</span>
                  </Link>
                  <button
                    className="user-menu__item user-menu__item--button"
                    type="button"
                    onClick={() => {
                      handleLogout()
                      setMenuOpen(false)
                    }}
                  >
                    <AppIcon name="logout" size={16} />
                    <span>Log out</span>
                  </button>
                </>
              ) : (
                <Link className="user-menu__item" to="/auth" onClick={() => setMenuOpen(false)}>
                  <AppIcon name="auth" size={16} />
                  <span>Sign in / Create account</span>
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </header>

      <nav className="section-nav shell-nav" aria-label="Primary navigation">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            aria-label={item.to === '/auth' && user ? 'Account' : item.label}
            className={({ isActive }) => {
              const classes = ['shell-nav__link']

              if (isActive) classes.push('shell-nav__link--active')

              return classes.join(' ')
            }}
            end={item.end}
            onClick={() => setMenuOpen(false)}
            title={item.to === '/auth' && user ? 'Account' : item.label}
            to={item.to}
          >
            <span className="shell-nav__tooltip">{item.to === '/auth' && user ? 'Account' : item.label}</span>
            <span className="shell-nav__icon-shell">
              <AppIcon className="shell-nav__icon" name={item.icon} size={18} />
            </span>
            <span className="shell-nav__text">
              {item.iconOnly ? 'Home' : item.to === '/auth' && user ? 'Account' : item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {isHomePage && !isAdmin ? (
        <section className="banner-card">
          <div className="banner-card__hero">
            <div className="banner-card__copy">
              <div className="banner-card__eyebrow-row">
                <span className="eyebrow banner-card__eyebrow">SonE kitchen journal</span>
                <span className="banner-card__account-pill">
                  {user ? `For ${accountName}` : 'Personal meal support'}
                </span>
              </div>

              <h1>Cook with clarity. Eat with purpose.</h1>
              <p className="hero-subtitle banner-card__lead">
                SonE brings meal planning, saved history, shopping cost, and family budgeting into one calm place that is easy to use every day.
              </p>

              <div className="banner-card__actions action-row">
                <Link className="primary-button" to={user ? '/planner' : '/auth'}>
                  {user ? 'Plan today menu' : 'Sign in to start'}
                </Link>
                <Link className="ghost-button" to={user ? '/history' : '/library'}>
                  {user ? 'Open your history' : 'Explore meals'}
                </Link>
              </div>

              <div className="banner-metrics">
                {summaryStats.map((stat) => (
                  <div className="banner-metric" key={stat.label}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="banner-feature-card">
              {featuredMeal ? (
                <>
                  <div className="banner-feature-card__image-wrap">
                    <img
                      alt={featuredMeal.name}
                      className="banner-feature-card__image"
                       src={resolveImageUrl(featuredMeal.image_url, featuredMeal.name, featuredMeal.group)}
                    />
                  </div>
                  <div className="banner-feature-card__content">
                    <span className="chip chip--accent">Meal of the day</span>
                    <h2>{featuredMeal.name}</h2>
                    <p>
                      A balanced pick from SonE with {featuredMeal.calories || 0} kcal and a clean group of{' '}
                      {getGroupLabel(featuredMeal.group) || 'healthy ingredients'}.
                    </p>
                    <div className="banner-feature-card__meta">
                      <span>{getGroupLabel(featuredMeal.group) || 'Meal'}</span>
                      <span>{featuredMeal.calories || 0} kcal</span>
                    </div>
                    <Link
                      className="banner-feature-card__link"
                       to={`/library?meal=${encodeURIComponent(featuredMeal._id || featuredMeal.name)}&search=${encodeURIComponent(featuredMeal.name)}`}
                      onClick={() => setMealQuery(featuredMeal.name)}
                    >
                      View this meal
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="banner-spotlight-grid">
            {spotlightMeals.map((meal) => (
              <Link
                className="banner-spotlight-card"
                key={meal._id || meal.name}
                to={`/library?meal=${encodeURIComponent(meal._id || meal.name)}&search=${encodeURIComponent(meal.name)}`}
                onClick={() => setMealQuery(meal.name)}
              >
                <div className="banner-spotlight-card__image-wrap">
                   <img alt={meal.name} className="banner-spotlight-card__image" src={resolveImageUrl(meal.image_url, meal.name, meal.group)} />
                </div>
                <div className="banner-spotlight-card__content">
                  <span className="chip chip--outline">{getGroupLabel(meal.group) || 'Meal'}</span>
                  <h3>{meal.name}</h3>
                  <p>{meal.calories || 0} kcal</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {notice ? (
        <Notice onDismiss={clearNotice} tone={notice.tone}>
          {notice.message}
        </Notice>
      ) : null}
      {errors.boot ? <Notice tone="error">{errors.boot}</Notice> : null}

      <main className="content-grid app-shell__main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <span className="eyebrow eyebrow--soft">Contact SonE</span>
            <h2>Stay connected with our cooking space.</h2>
            <p>
              SonE helps each account plan meals clearly, track choices with less friction, and build healthier routines over time.
            </p>
          </div>

          <div className="site-footer__column">
            <strong>Contact</strong>
            <a href="mailto:hello@sone.vn">hello@sone.vn</a>
            <a href="tel:+84987654321">(+84) 987 654 321</a>
            <span>Ho Chi Minh City, Vietnam</span>
            <span>Mon - Sat, 8:30 - 18:00</span>
          </div>

          <div className="site-footer__column">
            <strong>Explore</strong>
            <Link to="/library">Meal library</Link>
            {isAdmin ? <Link to="/history">User management</Link> : <Link to="/planner">Meal planner</Link>}
            {isAdmin ? null : <Link to="/family">Family menu</Link>}
            <Link to="/pricing">Ingredient pricing</Link>
          </div>

          <div className="site-footer__column">
            <strong>Support</strong>
            <Link to="/auth">Your account</Link>
            <Link to="/history">Meal history</Link>
            <a href="https://www.instagram.com" rel="noreferrer" target="_blank">
              Instagram
            </a>
            <a href="https://www.facebook.com" rel="noreferrer" target="_blank">
              Facebook
            </a>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>SonE Wellness Kitchen</span>
          <span>{user ? `Signed in as ${maskEmail(user.email)}` : 'Guest session'}</span>
        </div>
      </footer>
    </div>
  )
}

export default AppShell
