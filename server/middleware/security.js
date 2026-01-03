import helmet from 'helmet'
import cors from 'cors'
import crypto from 'crypto'

/**
 * Configure Helmet security headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
})

/**
 * Configure CORS
 */
export const corsOptions = cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
})

/**
 * Generate CSRF token
 */
export const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * CSRF protection middleware
 */
export const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests
  if (req.method === 'GET') {
    return next()
  }
  
  const token = req.headers['x-csrf-token']
  const sessionToken = req.cookies.csrf_token
  
  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
    })
  }
  
  next()
}

/**
 * Set CSRF token cookie
 */
export const setCsrfToken = (req, res, next) => {
  if (!req.cookies.csrf_token) {
    const token = generateCsrfToken()
    res.cookie('csrf_token', token, {
      httpOnly: false, // Allow JavaScript to read for sending in headers
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })
  }
  next()
}
