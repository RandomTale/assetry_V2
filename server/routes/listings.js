const express = require('express')
const router = express.Router()
const { prisma } = require('../lib/prisma')
const authMiddleware = require('../middleware/auth')

// GET /api/listings — fetch all listings (optionally filter by category)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query
    let where = {}

    if (category && category !== 'all') {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const listings = await prisma.listing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    res.json(listings)
  } catch (err) {
    console.error('Get listings error:', err)
    res.status(500).json({ error: 'Failed to fetch listings' })
  }
})

// GET /api/listings/:id — get a single listing
router.get('/:id', async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id }
    })
    if (!listing) return res.status(404).json({ error: 'Listing not found' })
    res.json(listing)
  } catch (err) {
    console.error('Get listing error:', err)
    res.status(500).json({ error: 'Failed to fetch listing' })
  }
})

// POST /api/listings — create a new listing (auth required)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, price, fileUrl, category, previewUrl, tags } = req.body
    if (!title || !description || !price) {
      return res.status(400).json({ error: 'Title, description, and price are required' })
    }

    const seller = await prisma.user.findUnique({
      where: { id: req.user.userId }
    })

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        fileUrl: fileUrl || '',
        previewUrl: previewUrl || '',
        category: category || 'other',
        tags: tags || [],
        sellerId: req.user.userId,
        sellerAddress: req.user.walletAddress,
        sellerUsername: seller?.username || null,
        salesCount: 0
      }
    })

    res.status(201).json(listing)
  } catch (err) {
    console.error('Create listing error:', err)
    res.status(500).json({ error: 'Failed to create listing' })
  }
})

// DELETE /api/listings/:id — delete listing (seller only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id }
    })
    if (!listing) return res.status(404).json({ error: 'Listing not found' })
    if (listing.sellerId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    
    await prisma.listing.delete({
      where: { id: req.params.id }
    })
    
    res.json({ message: 'Listing deleted' })
  } catch (err) {
    console.error('Delete listing error:', err)
    res.status(500).json({ error: 'Failed to delete listing' })
  }
})

// GET /api/listings/seller/:userId — all listings by a seller
router.get('/seller/:userId', async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { sellerId: req.params.userId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(listings)
  } catch (err) {
    console.error('Get seller listings error:', err)
    res.status(500).json({ error: 'Failed to fetch listings' })
  }
})

module.exports = router
