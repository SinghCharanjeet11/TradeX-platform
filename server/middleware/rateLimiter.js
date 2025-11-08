import rateLimit from 'express-rate-limit'
import { query } from '../config/database.js'

/**
 * Rate limiter for login attempts
 * 5 attempts per 15 minutes per email
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.email || req.ip
  },
})

/**
 * Rate limiter for registration
 * 10 attempts per hour per IP
 */
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: 'Too many registration attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiter for password reset requests
 * 3 attempts per hour per email
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: 'Too many password reset requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.email || req.ip
  },
})

/**
 * Log failed login attempt to database
 */
export const logLoginAttempt = async (req, res, next) => {
  const { email } = req.body
  const ipAddress = req.ip || req.connection.remoteAddress
  
  // Store original res.json
  const originalJson = res.json.bind(res)
  
  // Override res.json to capture response
  res.json = function (data) {
    const successful = data.success === true
    
    // Log to database
    if (email) {
      const sql = `
        INSERT INTO login_attempts (email, ip_address, successful)
        VALUES ($1, $2, $3)
      `
      query(sql, [email, ipAddress, successful]).catch((error) => {
        console.error('Error logging login attempt:', error)
      })
    }
    
    // Call original json method
    return originalJson(data)
  }
  
  next()
}

/**
 * Check if email has too many failed login attempts
 */
export const checkFailedAttempts = async (req, res, next) => {
  const { email } = req.body
  
  if (!email) {
    return next()
  }
  
  try {
    const sql = `
      SELECT COUNT(*) as count
      FROM login_attempts
      WHERE email = $1 
        AND successful = FALSE 
        AND attempted_at > NOW() - INTERVAL '15 minutes'
    `
    const result = await query(sql, [email])
    const failedAttempts = parseInt(result.rows[0].count)
    
    if (failedAttempts >= 5) {
      return res.status(429).json({
        success: false,
        error: 'Too many failed login attempts. Please try again in 15 minutes.',
      })
    }
    
    next()
  } catch (error) {
    console.error('Error checking failed attempts:', error)
    next()
  }
}

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
