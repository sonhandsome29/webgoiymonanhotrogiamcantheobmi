export default function SkeletonLoader({ count = 3, layout = 'grid' }) {
  const items = Array.from({ length: count }, (_, i) => i)

  if (layout === 'list') {
    return (
      <div className="flex flex-col gap-4 w-full">
        {items.map((i) => (
          <div key={i} className="skeleton-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '20px' }}>
            <div className="skeleton-image shimmer-skeleton" style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '16px', aspectRatio: '1' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="skeleton-line skeleton-line--title shimmer-skeleton" style={{ height: '18px' }} />
              <div className="skeleton-line skeleton-line--subtitle shimmer-skeleton" style={{ height: '12px', width: '50%' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
      {items.map((i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-image shimmer-skeleton" />
          <div className="skeleton-line skeleton-line--title shimmer-skeleton" />
          <div className="skeleton-line skeleton-line--text shimmer-skeleton" style={{ height: '12px' }} />
          <div className="skeleton-line skeleton-line--subtitle shimmer-skeleton" style={{ height: '12px' }} />
          <div style={{ display: 'flex', gap: '8px', paddingTop: '8px' }}>
            <div className="shimmer-skeleton" style={{ height: '36px', borderRadius: '12px', flex: 1 }} />
            <div className="shimmer-skeleton" style={{ height: '36px', borderRadius: '12px', flex: 1 }} />
          </div>
        </div>
      ))}
    </div>
  )
}
