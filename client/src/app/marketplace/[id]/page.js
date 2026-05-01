'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getListing, createPurchase } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

const CATEGORY_ICONS = {
  software: '💻', art: '🎨', music: '🎵',
  ebook: '📚', template: '🖼️', other: '📦',
}

function shortAddress(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : 'Unknown'
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ListingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, token } = useAuth()

  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getListing(id)
      .then(setListing)
      .catch(() => setError('Listing not found.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleBuy() {
    if (!user) return setError('Connect your wallet first.')
    if (!token) return setError('Please sign in to purchase.')
    setBuying(true)
    setError('')
    try {
      await createPurchase({ listingId: id }, token)
      setSuccess('🎉 Purchase initiated! Funds are now in escrow. Check your dashboard to confirm delivery.')
    } catch (err) {
      setError(err.message || 'Purchase failed. Please try again.')
    } finally {
      setBuying(false)
    }
  }

  if (loading) return (
    <div className="container">
      <div className="loading-state"><div className="spinner" /><span>Loading listing…</span></div>
    </div>
  )

  if (error && !listing) return (
    <div className="container">
      <div className="alert alert-error" style={{ marginTop: 40 }}>{error}</div>
    </div>
  )

  if (!listing) return null

  const isOwner = user?.id === listing.sellerId || user?.walletAddress === listing.sellerAddress

  return (
    <div className="container">
      <div className="detail-layout">
        {/* ── LEFT: listing info ── */}
        <div>
          {/* Preview */}
          <div className="detail-preview" style={{ marginBottom: 32 }}>
            {listing.previewUrl
              ? <img src={listing.previewUrl} alt={listing.title} />
              : <span className="detail-big-icon">{CATEGORY_ICONS[listing.category] || '📦'}</span>
            }
          </div>

          {/* Category + date */}
          <div className="detail-meta">
            <span className="badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', border: '1px solid var(--border-accent)' }}>
              {CATEGORY_ICONS[listing.category] || '📦'} {listing.category || 'Other'}
            </span>
            {listing.createdAt && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Listed {formatDate(listing.createdAt)}
              </span>
            )}
            {listing.salesCount > 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {listing.salesCount} sale{listing.salesCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <h1 className="detail-title">{listing.title}</h1>

          {/* Seller info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, padding: '12px 16px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
            <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
              {(listing.sellerUsername || listing.sellerAddress || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Seller</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {listing.sellerUsername || shortAddress(listing.sellerAddress)}
              </div>
            </div>
          </div>

          {/* Description */}
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 12 }}>About this asset</h2>
          <p className="detail-desc">{listing.description}</p>

          {/* Tags */}
          {listing.tags?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Tags</h3>
              <div className="detail-tags">
                {listing.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: buy panel ── */}
        <div className="buy-panel">
          <div className="glass-card">
            <div className="buy-price">{listing.price} ETH</div>
            <div className="buy-label">One-time payment · instant digital delivery</div>

            <div className="escrow-note">
              <span className="escrow-icon">🔒</span>
              <span>
                Your payment is held in <strong>escrow</strong> until you confirm delivery.
                The seller only receives funds after you verify the asset.
              </span>
            </div>

            {success ? (
              <div className="alert alert-success">{success}</div>
            ) : error ? (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>
            ) : null}

            {isOwner ? (
              <div className="alert alert-info">
                This is your listing. You cannot purchase your own asset.
              </div>
            ) : !user ? (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Connect your wallet to purchase this asset.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <a href="/" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Connect Wallet
                  </a>
                </div>
              </div>
            ) : !success && (
              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
                onClick={handleBuy}
                disabled={buying}
                id="buy-btn"
              >
                {buying ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing…</> : `Buy for ${listing.price} ETH`}
              </button>
            )}

            {/* Trust badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              {[['✅', 'Escrow protection'], ['⚡', 'Instant delivery'], ['🔐', 'Wallet-based auth'], ['🆘', 'Dispute resolution']].map(([icon, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span>{icon}</span><span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
