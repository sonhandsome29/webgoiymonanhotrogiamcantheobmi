import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Notice from './Notice'
import { resolveImageUrl } from '../../lib/api'
import { formatNumber, getGroupLabel } from '../../utils/formatters'
import { useAppContext } from '../../hooks/useAppContext'

function MealDetailModal({ meal, onClose }) {
  const { language } = useAppContext()

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!meal) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [meal])

  // Close on Escape key
  useEffect(() => {
    if (!meal) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [meal, onClose])

  if (!meal) return null

  const imageSrc = resolveImageUrl(meal.image_url, meal.name, meal.group)
  const vi = language === 'vi'

  const macros = [
    { value: formatNumber(meal.calories), unit: 'Kcal', color: 'var(--warm-deep)', bg: 'var(--warm-soft)', border: '1px solid var(--warm)' },
    { value: `${formatNumber(meal.protein)}g`, unit: vi ? 'Đạm' : 'Protein', color: 'var(--accent-strong)', bg: 'var(--accent-soft)', border: '1px solid var(--accent-mid)' },
    { value: `${formatNumber(meal.carbs)}g`, unit: vi ? 'Bột' : 'Carbs', color: 'var(--amber)', bg: 'var(--amber-soft)', border: '1px solid var(--subtle)' },
    { value: `${formatNumber(meal.fat)}g`, unit: vi ? 'Béo' : 'Fat', color: 'var(--ink-2)', bg: 'var(--paper-hover)', border: '1px solid var(--line)' },
  ]

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={meal.name}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(28, 25, 23, 0.4)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'modal-overlay-in 0.25s ease both',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '780px',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          borderRadius: '12px',
          background: 'var(--paper-bright)',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow-md)',
          animation: 'modal-card-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HERO IMAGE + CLOSE BUTTON ── */}
        <div style={{ position: 'relative', height: '260px', overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
          {imageSrc ? (
            <img
              alt={meal.name}
              src={imageSrc}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = '/images/Salad%20rau%20c%E1%BB%A7.jpg'
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--paper-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '4rem', opacity: 0.3 }}>🍽️</span>
            </div>
          )}

          {/* Gradient overlay for readability */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(28,25,23,0.5) 0%, transparent 60%)' }} />

          {/* Chip + Close on hero */}
          <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <span className="chip chip--accent" style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}>
              {getGroupLabel(meal.group) || (vi ? 'Món ăn' : 'Meal')}
            </span>

            <button
              type="button"
              onClick={onClose}
              aria-label={vi ? 'Đóng' : 'Close'}
              style={{
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.25)',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '1.1rem',
                lineHeight: 1,
                flexShrink: 0,
                transition: 'background 0.2s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'scale(1.08)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'scale(1)' }}
            >
              ✕
            </button>
          </div>

          {/* Meal name on hero bottom */}
          <div style={{ position: 'absolute', bottom: '20px', left: '24px', right: '24px' }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.6rem', fontWeight: 700, textShadow: '0 2px 8px rgba(0,0,0,0.4)', lineHeight: 1.2, fontFamily: 'var(--font-heading)' }}>
              {meal.name}
            </h2>
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ padding: '24px 28px 28px' }}>

          {/* ── MACROS STRIP ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
            {macros.map(({ value, unit, color, bg, border }) => (
              <div
                key={unit}
                style={{
                  borderRadius: '8px',
                  background: bg,
                  border: border,
                  padding: '12px 8px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color, fontFamily: 'var(--font-heading)' }}>{value}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color, opacity: 0.75 }}>{unit}</span>
              </div>
            ))}
          </div>

          {/* ── TWO-COL CONTENT ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Instructions */}
            <div style={{ gridColumn: meal.ingredients?.length ? '1' : '1 / -1', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--paper)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '1.1rem' }}>📋</span>
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
                  {vi ? 'Hướng dẫn chế biến' : 'Instructions'}
                </h4>
              </div>
              <p style={{ margin: 0, lineHeight: 1.65, color: 'var(--ink)', fontSize: '0.92rem' }}>
                {meal.instructions || (vi ? 'Chưa có hướng dẫn cho món này.' : 'No instructions available for this meal.')}
              </p>
            </div>

            {/* Ingredients */}
            {(meal.ingredients || []).length > 0 && (
              <div style={{ borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--paper)', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🧂</span>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
                    {vi ? 'Nguyên liệu' : 'Ingredients'}
                  </h4>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {meal.ingredients.map((ing) => (
                    <span
                      key={ing}
                      style={{
                        padding: '4px 11px',
                        borderRadius: '4px',
                        background: 'var(--paper-mid)',
                        border: '1px solid var(--line)',
                        color: 'var(--ink)',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                      }}
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── CLOSE FOOTER ── */}
          <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 28px',
                borderRadius: '999px',
                border: '1px solid var(--line)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'background 0.2s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--line)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--paper)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {vi ? 'Đóng' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default MealDetailModal
