import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes.js'
import sessionRoutes from './routes/sessionRoutes.js'
import marketRoutes from './routes/marketRoutes.js'
import portfolioRoutes from './routes/portfolioRoutes.js'
import holdingsRoutes from './routes/holdingsRoutes.js'
import watchlistRoutes from './routes/watchlistRoutes.js'
import newsRoutes from './routes/newsRoutes.js'
import priceRoutes from './routes/priceRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import paperTradingRoutes from './routes/paperTradingRoutes.js'
import aiInsightsRoutes from './routes/aiInsightsRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import setupRoutes from './routes/setupRoutes.js'
import { securityHeaders, corsOptions, setCsrfToken } from './middleware/security.js'
import { validateConfig } from './config/apiConfig.js'
import sessionCleanupJob from './jobs/sessionCleanup.js'

dotenv.config()

// Validate API configuration
validateConfig()

// Check encryption key
if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ ENCRYPTION_KEY not found in environment variables!')
  console.error('❌ Please add ENCRYPTION_KEY to your .env file')
  process.exit(1)
} else {
  console.log('✅ Encryption key loaded successfully')
}

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
app.use('/api/setup', setupRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/markets', marketRoutes)
app.use('/api/portfolio', portfolioRoutes)
app.use('/api/holdings', holdingsRoutes)
app.use('/api/watchlist', watchlistRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/insights', aiInsightsRoutes)
app.use('/api/prices', priceRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/paper-trading', paperTradingRoutes)

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
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  
  // Run migrations automatically if DATABASE_URL is set
  if (process.env.DATABASE_URL) {
    try {
      console.log('🔄 Running database migrations...')
      const { runMigrations } = await import('./database/init.js')
      await runMigrations()
      console.log('✅ Database migrations completed')
    } catch (error) {
      console.error('❌ Migration error:', error)
      // Don't crash the server, just log the error
    }
  }
  
  // Start scheduled jobs
  sessionCleanupJob.start()
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  sessionCleanupJob.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server')
  sessionCleanupJob.stop()
  process.exit(0)
})

export default app
