import { Link } from 'react-router-dom'
import { useAppContext } from '../hooks/useAppContext'
import SectionHeading from '../components/ui/SectionHeading'
import Notice from '../components/ui/Notice'

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
  } = useAppContext()

  return (
    <section className="panel panel--auth">
      <div className="auth-page__intro">
        <SectionHeading
          eyebrow="Authentication"
          title={user ? (isAdmin ? 'Admin Overview' : 'Your Account') : 'Sign in to continue'}
        />
      </div>

      {user ? (
        <div className="panel-stack auth-page__card-wrap">
          <div className="user-card auth-page__card tw-surface-soft p-6">
            <span className="chip chip--accent">Active session</span>
            <h3>{user.email}</h3>
            {isAdmin ? null : <p>User ID: {user.userId}</p>}

            {isAdmin ? (
              <div className="mini-metric-row mini-metric-row--single">
                <div className="mini-metric">
                  <strong>{registeredUsersCount}</strong>
                  <span>registered users</span>
                </div>
              </div>
            ) : (
              <div className="mini-metric-row">
                <div className="mini-metric">
                  <strong>{historyRecords.length}</strong>
                  <span>saved days</span>
                </div>
                <div className="mini-metric">
                  <strong>{savedDays.size}</strong>
                  <span>days with data</span>
                </div>
              </div>
            )}

            <div className="action-row auth-page__actions">
              <button className="ghost-button" type="button" onClick={handleLogout}>
                Log out
              </button>
              {isAdmin ? null : (
                <Link className="primary-button" to="/history">
                  Open meal history
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
                Sign in
              </button>
              <button
                className={authMode === 'register' ? 'is-active' : ''}
                type="button"
                onClick={() => setAuthMode('register')}
              >
                Create account
              </button>
            </div>
          </div>

          <div className="field-grid field-grid--single">
            <label className="field">
              <span>Email</span>
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
              <span>Password</span>
              <input
                type="password"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm((previous) => ({ ...previous, password: event.target.value }))
                }
                placeholder="Enter your password"
                required
              />
            </label>
          </div>

          {errors.auth ? <Notice tone="error">{errors.auth}</Notice> : null}

          <div className="action-row auth-page__actions">
            <button className="primary-button" type="submit" disabled={loading.auth}>
              {loading.auth
                ? 'Processing...'
                : authMode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

export default AuthPage
