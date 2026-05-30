import { useEffect, useState } from 'react'
import AppIcon from '../icons/AppIcon'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="theme-toggle-btn"
      aria-label="Toggle theme"
      type="button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '44px',
        height: '44px',
        borderRadius: '14px',
        border: '1px solid var(--line)',
        backgroundColor: 'var(--paper-bright)',
        color: 'var(--ink)',
        cursor: 'pointer',
        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease, border-color 0.3s ease',
        boxShadow: 'var(--shadow-soft)',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <AppIcon name={isDark ? 'sun' : 'moon'} size={18} />
    </button>
  )
}
