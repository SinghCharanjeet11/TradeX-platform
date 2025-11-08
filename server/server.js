import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes.js'
import marketRoutes from './routes/marketRoutes.js'
import { securityHeaders, corsOptions, setCsrfToken } from './middleware/security.js'
import { validateConfig } from './config/apiConfig.js'

dotenv.config()

// Validate API configuration
validateConfig()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(securityHeaders)
app.use(corsOptions)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(setCsrfToken)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/markets', marketRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app
