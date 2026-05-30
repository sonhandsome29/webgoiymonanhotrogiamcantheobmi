function Notice({ tone = 'info', children, onDismiss }) {
  const toneClasses = {
    error: 'border-orange-500/20 bg-orange-500/10 text-[var(--warm-deep)]',
    info: 'border-[var(--line)] bg-[var(--glass-bg)] text-[var(--ink)]',
    success: 'border-emerald-500/20 bg-emerald-500/10 text-[var(--accent-strong)]',
  }

  return (
    <div
      className={`notice notice--${tone} flex items-start justify-between gap-4 rounded-[22px] border px-4 py-4 shadow-sm backdrop-blur-sm ${toneClasses[tone] || toneClasses.info}`}
    >
      <span className="min-w-0 flex-1 leading-7">{children}</span>
      {onDismiss ? (
        <button
          className="notice__dismiss inline-flex min-h-9 flex-shrink-0 items-center rounded-full border border-[var(--line)] bg-[var(--glass-bg)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-px hover:shadow-sm"
          type="button"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      ) : null}
    </div>
  )
}

export default Notice
