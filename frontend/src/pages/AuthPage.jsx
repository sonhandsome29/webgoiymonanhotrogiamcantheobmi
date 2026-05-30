import { Link } from 'react-router-dom'
import { useAppContext } from '../hooks/useAppContext'
import SectionHeading from '../components/ui/SectionHeading'
import Notice from '../components/ui/Notice'
import { maskEmail } from '../utils/formatters'

function AuthPage() {
  const {
    authForm,
    authMode,
    errors,
    handleAuthSubmit,
    handleLogout,
    historyRecords,
    isAdmin,
    loading,
    registeredUsersCount,
    savedDays,
    setAuthForm,
    setAuthMode,
    user,
    t,
  } = useAppContext()

  return (
    <section className="panel panel--auth">
      <div className="auth-page__intro">
        <SectionHeading
          eyebrow={t('account')}
          title={user ? (isAdmin ? t('admin_dashboard') : t('account')) : t('sign_in')}
        />
      </div>

      {user ? (
        <div className="panel-stack auth-page__card-wrap">
          <div className="user-card auth-page__card tw-surface-soft p-6">
            <span className="chip chip--accent">{t('account')}</span>
            <h3>{maskEmail(user.email)}</h3>
            {isAdmin ? null : <p>User ID: {user.userId}</p>}

            {isAdmin ? (
              <div className="mini-metric-row mini-metric-row--single">
                <div className="mini-metric">
                  <strong>{registeredUsersCount}</strong>
                  <span>{t('stat_registered_users')}</span>
                </div>
              </div>
            ) : (
              <div className="mini-metric-row">
                <div className="mini-metric">
                  <strong>{historyRecords.length}</strong>
                  <span>{t('stat_saved_days')}</span>
                </div>
                <div className="mini-metric">
                  <strong>{savedDays.size}</strong>
                  <span>{t('stat_saved_days')}</span>
                </div>
              </div>
            )}

            <div className="action-row auth-page__actions">
              <button className="ghost-button" type="button" onClick={handleLogout}>
                {t('sign_out')}
              </button>
              {isAdmin ? null : (
                <Link className="primary-button" to="/history">
                  {t('meal_history')}
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <form className="panel-stack auth-page__card auth-page__form tw-surface-soft p-6" onSubmit={handleAuthSubmit}>
          <div className="auth-page__segment-wrap">
            <div className="segmented-control">
              <button
                className={authMode === 'login' ? 'is-active' : ''}
                type="button"
                onClick={() => setAuthMode('login')}
              >
                {t('login')}
              </button>
              <button
                className={authMode === 'register' ? 'is-active' : ''}
                type="button"
                onClick={() => setAuthMode('register')}
              >
                {t('register')}
              </button>
            </div>
          </div>

          <div className="field-grid field-grid--single">
            <label className="field">
              <span>{t('email_label')}</span>
              <input
                type="email"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm((previous) => ({ ...previous, email: event.target.value }))
                }
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="field">
              <span>{t('password_label')}</span>
              <input
                type="password"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm((previous) => ({ ...previous, password: event.target.value }))
                }
                placeholder={t('password_help')}
                required
              />
            </label>
          </div>

          {errors.auth ? <Notice tone="error">{errors.auth}</Notice> : null}

          <div className="action-row auth-page__actions">
            <button className="primary-button" type="submit" disabled={loading.auth}>
              {loading.auth
                ? t('loading')
                : authMode === 'login'
                  ? t('login_btn')
                  : t('register_btn')}
            </button>
          </div>

          <p className="subtle-text" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            {authMode === 'login' ? t('switch_to_register') : t('switch_to_login')}
          </p>
        </form>
      )}
    </section>
  )
}

export default AuthPage
