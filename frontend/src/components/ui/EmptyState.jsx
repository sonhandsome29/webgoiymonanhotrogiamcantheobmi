function EmptyState({ title, description, action, className = '' }) {
  return (
    <div className={`empty-state flex min-h-[180px] flex-col justify-center gap-3 rounded-3xl border border-[var(--line)] bg-[var(--glass-bg)] backdrop-blur-md p-6 shadow-soft ${className}`.trim()}>
      <h3 className="font-heading text-[var(--ink)]">{title}</h3>
      <p className="text-[var(--muted)]">{description}</p>
      {action ? <div className="empty-state__action pt-2">{action}</div> : null}
    </div>
  )
}

export default EmptyState
