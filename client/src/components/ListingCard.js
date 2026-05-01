import Link from 'next/link'

const CATEGORY_ICONS = {
  software: '💻',
  art: '🎨',
  music: '🎵',
  ebook: '📚',
  template: '🖼️',
  other: '📦',
}

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#10b981',
  disputed: '#ef4444',
}

export default function ListingCard({ listing, compact = false }) {
  const {
    id, title, description, price, category,
    previewUrl, sellerUsername, sellerAddress, salesCount
  } = listing

  const shortAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : 'Unknown'

  return (
    <Link href={`/marketplace/${id}`} className="listing-card" id={`listing-${id}`}>
      {/* Preview / thumbnail */}
      <div className="card-preview">
        {previewUrl ? (
          <img src={previewUrl} alt={title} className="card-img" />
        ) : (
          <div className="card-placeholder">
            <span className="card-icon">{CATEGORY_ICONS[category] || '📦'}</span>
          </div>
        )}
        <span className="card-category">{category || 'other'}</span>
      </div>

      {/* Content */}
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        {!compact && (
          <p className="card-desc">{description?.slice(0, 100)}{description?.length > 100 ? '…' : ''}</p>
        )}

        <div className="card-footer">
          <div className="card-seller">
            <span className="seller-avatar">
              {(sellerUsername || sellerAddress || '?')[0].toUpperCase()}
            </span>
            <span className="seller-name">
              {sellerUsername || shortAddress(sellerAddress)}
            </span>
          </div>

          <div className="card-meta">
            {salesCount > 0 && (
              <span className="card-sales">{salesCount} sold</span>
            )}
            <span className="card-price">{price} ETH</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
