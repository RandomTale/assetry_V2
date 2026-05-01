Sure! Here's the complete setup guide for your final stack.

## Prerequisites

Make sure you have these installed:
- **Node.js** (v20 or later) — [nodejs.org](https://nodejs.org)
- **PostgreSQL 16** — [postgresql.org](https://www.postgresql.org/download/)
- **Git** — [git-scm.com](https://git-scm.com)

Verify everything is installed:
```bash
node -v
psql --version
git --version
```

---

## 1. Create the Project Folder

```bash
mkdir assetry
cd assetry
git init
```

---

## 2. Setup the Frontend (Next.js + Tailwind)

```bash
npx create-next-app@latest client
```

When prompted, answer like this:
```
Would you like to use TypeScript? No
Would you like to use ESLint? Yes
Would you like to use Tailwind CSS? Yes
Would you like to use the src/ directory? Yes
Would you like to use App Router? Yes
Would you like to customize the import alias? No
```

Then go into the client folder:
```bash
cd client
```

Install Wagmi and its dependencies:
```bash
npm install wagmi viem @tanstack/react-query
```

Install SIWE:
```bash
npm install siwe
```

---

## 3. Configure Wagmi

Create `client/src/config/wagmi.js`:
```js
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [metaMask()],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})
```

Then wrap your app with the Wagmi provider. Edit `client/src/app/layout.js`:
```js
'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/config/wagmi'
import './globals.css'

const queryClient = new QueryClient()

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}
```

---

## 4. Setup the Backend (Node.js + Express)

Go back to the root folder:
```bash
cd ..
mkdir server
cd server
npm init -y
```

Install dependencies:
```bash
npm install express cors dotenv bcryptjs jsonwebtoken siwe ethers
npm install -D nodemon
```

Create `server/index.js`:
```js
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Assetry API running' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
```

Add scripts to `server/package.json`:
```json
"scripts": {
  "dev": "nodemon index.js",
  "start": "node index.js"
}
```

Create `server/.env`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/assetry"
JWT_SECRET="your_jwt_secret_key"
```

---

## 5. Setup SIWE Auth Routes

Create `server/routes/auth.js`:
```js
const express = require('express')
const router = express.Router()
const { SiweMessage } = require('siwe')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Step 1 - Frontend requests a nonce for the wallet address
router.get('/nonce', (req, res) => {
  const nonce = Math.random().toString(36).substring(2, 15)
  res.json({ nonce })
})

// Step 2 - Frontend sends back the signed message
router.post('/verify', async (req, res) => {
  try {
    const { message, signature } = req.body

    // Verify the signed message
    const siweMessage = new SiweMessage(message)
    const { data } = await siweMessage.verify({ signature })
    const walletAddress = data.address

    // Find or create the user
    let user = await prisma.user.findUnique({ where: { walletAddress } })
    if (!user) {
      user = await prisma.user.create({ data: { walletAddress } })
    }

    // Issue a JWT
    const token = jwt.sign(
      { userId: user.id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, user })
  } catch (err) {
    res.status(400).json({ error: 'Verification failed' })
  }
})

module.exports = router
```

Register the route in `server/index.js` by adding these two lines after `app.use(express.json())`:
```js
const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes)
```

---

## 6. Setup the Database (PostgreSQL + Prisma)

Make sure you're in the `server` folder, then:
```bash
npm install prisma@6 @prisma/client@6
npx prisma init
```

Replace the contents of `server/prisma/schema.prisma` with:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String     @id @default(uuid())
  walletAddress String     @unique
  username      String?    @unique
  createdAt     DateTime   @default(now())
  listings      Listing[]
  purchases     Purchase[] @relation("Buyer")
}

model Listing {
  id          String     @id @default(uuid())
  title       String
  description String
  price       Float
  fileUrl     String
  seller      User       @relation(fields: [sellerId], references: [id])
  sellerId    String
  createdAt   DateTime   @default(now())
  purchases   Purchase[]
}

model Purchase {
  id        String   @id @default(uuid())
  buyer     User     @relation("Buyer", fields: [buyerId], references: [id])
  buyerId   String
  listing   Listing  @relation(fields: [listingId], references: [id])
  listingId String
  status    String   @default("pending")
  createdAt DateTime @default(now())
}
```

Notice that compared to before, the `User` model no longer has `email` and `password` fields — just a `walletAddress` since we're using SIWE.

Now create the database and run the migration:
```bash
psql -U postgres -c "CREATE DATABASE assetry;"
npx prisma migrate dev --name init
```

---

## 7. Final Folder Structure

```
assetry/
├── client/                       # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── layout.js
│       │   └── page.js
│       └── config/
│           └── wagmi.js
└── server/                       # Express backend
    ├── prisma/
    │   └── schema.prisma
    ├── routes/
    │   └── auth.js
    ├── index.js
    ├── .env
    └── package.json
```

---

## 8. Running the Project

You'll need two terminals:

**Terminal 1 — Frontend:**
```bash
cd assetry/client
npm run dev
```

**Terminal 2 — Backend:**
```bash
cd assetry/server
npm run dev
```

Frontend runs at `http://localhost:3000` and backend at `http://localhost:5000`.

---

