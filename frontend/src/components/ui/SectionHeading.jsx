function SectionHeading({ eyebrow, title, description, actions }) {
  return (
    <div className="section-heading flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="max-w-3xl">
        <span className="eyebrow eyebrow--soft inline-flex items-center rounded-full bg-white/70 px-3 py-1 shadow-sm">
          {eyebrow}
        </span>
        <h2 className="font-heading text-sone-ink">{title}</h2>
        {description ? <p className="text-sone-muted">{description}</p> : null}
      </div>
      {actions ? <div className="section-actions flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}

export default SectionHeading
