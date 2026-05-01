'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createListing } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

const CATEGORIES = ['software', 'art', 'music', 'ebook', 'template', 'other']
const CATEGORY_ICONS = {
  software: '💻', art: '🎨', music: '🎵',
  ebook: '📚', template: '🖼️', other: '📦',
}

export default function CreateListingPage() {
  const router = useRouter()
  const { user, token } = useAuth()

  const [form, setForm] = useState({
    title: '', description: '', price: '',
    category: 'software', fileUrl: '', previewUrl: '', tags: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="container">
        <div className="glass-card" style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔐</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>
            Connect your wallet
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            You need to connect your wallet and sign in before creating a listing.
          </p>
          <Link href="/" className="btn-primary" style={{ display: 'inline-flex' }}>Go to Home</Link>
        </div>
      </div>
    )
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.title.trim() || !form.description.trim() || !form.price) {
      return setError('Title, description, and price are required.')
    }
    if (isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) {
      return setError('Price must be a positive number.')
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }
      const listing = await createListing(payload, token)
      router.push(`/marketplace/${listing.id}`)
    } catch (err) {
      setError(err.message || 'Failed to create listing.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className="page-header">
          <h1>Create a Listing</h1>
          <p>Fill in the details below to list your digital asset on the marketplace.</p>
        </div>

        <form className="glass-card" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Category picker */}
          <div>
            <label className="form-label">Category</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              {CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat}
                  className={`filter-chip ${form.category === cat ? 'filter-chip-active' : ''}`}
                  onClick={() => setForm(p => ({ ...p, category: cat }))}
                  id={`cat-${cat}`}
                >
                  {CATEGORY_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="title">Title *</label>
            <input
              id="title" name="title" className="form-input"
              placeholder="e.g. Premium UI Kit — 200+ components"
              value={form.title} onChange={handleChange}
              maxLength={80}
            />
            <span className="form-hint">{form.title.length}/80 characters</span>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">Description *</label>
            <textarea
              id="description" name="description" className="form-textarea"
              placeholder="Describe what the buyer will receive, what's included, and why it's valuable…"
              value={form.description} onChange={handleChange}
              rows={5}
            />
          </div>

          {/* Price */}
          <div className="form-group">
            <label className="form-label" htmlFor="price">Price (ETH) *</label>
            <div style={{ position: 'relative' }}>
              <input
                id="price" name="price" className="form-input"
                type="number" step="0.0001" min="0.0001"
                placeholder="0.05"
                value={form.price} onChange={handleChange}
                style={{ paddingRight: 56 }}
              />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                ETH
              </span>
            </div>
          </div>

          {/* File URL */}
          <div className="form-group">
            <label className="form-label" htmlFor="fileUrl">File / Download URL</label>
            <input
              id="fileUrl" name="fileUrl" className="form-input"
              placeholder="https://drive.google.com/… or IPFS link"
              value={form.fileUrl} onChange={handleChange}
            />
            <span className="form-hint">
              Add a download link visible only to buyers after purchase confirmation.
            </span>
          </div>

          {/* Preview URL */}
          <div className="form-group">
            <label className="form-label" htmlFor="previewUrl">Preview Image URL</label>
            <input
              id="previewUrl" name="previewUrl" className="form-input"
              placeholder="https://i.imgur.com/… or any public image URL"
              value={form.previewUrl} onChange={handleChange}
            />
            {form.previewUrl && (
              <div style={{ marginTop: 10, borderRadius: 'var(--radius-md)', overflow: 'hidden', height: 160 }}>
                <img src={form.previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label" htmlFor="tags">Tags</label>
            <input
              id="tags" name="tags" className="form-input"
              placeholder="react, dashboard, dark-mode (comma-separated)"
              value={form.tags} onChange={handleChange}
            />
          </div>

          {/* Escrow notice */}
          <div className="escrow-note">
            <span className="escrow-icon">🔒</span>
            <span>
              By listing, you agree that payments will be held in escrow until the buyer confirms delivery.
              You receive funds only after buyer confirmation.
            </span>
          </div>

          {/* Error */}
          {error && <div className="alert alert-error">{error}</div>}

          {/* Submit */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              id="create-listing-btn"
              style={{ flex: 1, justifyContent: 'center', padding: 14, fontSize: '1rem' }}
            >
              {loading
                ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating Listing…</>
                : '🚀 Publish Listing'
              }
            </button>
            <Link href="/marketplace" className="btn-secondary" style={{ padding: '14px 24px' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
