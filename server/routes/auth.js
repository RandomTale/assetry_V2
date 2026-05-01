const express = require('express')
const router = express.Router()
const { SiweMessage } = require('siwe')
const jwt = require('jsonwebtoken')
const { prisma } = require('../lib/prisma')

// GET /api/auth/nonce — generate a random nonce
router.get('/nonce', (req, res) => {
  const nonce = Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15)
  res.json({ nonce })
})

// POST /api/auth/verify — verify SIWE signed message, return JWT
router.post('/verify', async (req, res) => {
  try {
    const { message, signature } = req.body
    if (!message || !signature) {
      return res.status(400).json({ error: 'Message and signature are required' })
    }

    const siweMessage = new SiweMessage(message)
    const { data } = await siweMessage.verify({ signature })
    const walletAddress = data.address.toLowerCase()

    // Find or create user in Postgres
    let user = await prisma.user.findUnique({
      where: { walletAddress }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
          bio: '',
          avatarUrl: '',
        }
      })
    }

    const token = jwt.sign(
      { userId: user.id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, user })
  } catch (err) {
    console.error('SIWE verify error:', err)
    res.status(400).json({ error: 'Verification failed' })
  }
})

module.exports = router
