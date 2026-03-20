function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state flex min-h-[180px] flex-col justify-center gap-3 rounded-3xl border border-sone-line bg-white/85 p-6 shadow-soft">
      <h3 className="font-heading text-sone-ink">{title}</h3>
      <p className="text-sone-muted">{description}</p>
      {action ? <div className="empty-state__action pt-2">{action}</div> : null}
    </div>
  )
}

export default EmptyState
