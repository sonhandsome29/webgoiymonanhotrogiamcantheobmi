function Notice({ tone = 'info', children, onDismiss }) {
  const toneClasses = {
    error: 'border-orange-700/20 bg-orange-500/10 text-orange-950',
    info: 'border-sone-line bg-white/80 text-sone-ink',
    success: 'border-emerald-700/20 bg-emerald-700/10 text-emerald-950',
  }

  return (
    <div
      className={`notice notice--${tone} flex items-start justify-between gap-4 rounded-[22px] border px-4 py-4 shadow-sm backdrop-blur-sm ${toneClasses[tone] || toneClasses.info}`}
    >
      <span className="min-w-0 flex-1 leading-7">{children}</span>
      {onDismiss ? (
        <button
          className="notice__dismiss inline-flex min-h-9 flex-shrink-0 items-center rounded-full border border-black/10 bg-white/80 px-4 text-sm font-semibold text-sone-ink transition hover:-translate-y-px hover:shadow-sm"
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
