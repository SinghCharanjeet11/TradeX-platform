import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
const JWT_REMEMBER_EXPIRES_IN = process.env.JWT_REMEMBER_EXPIRES_IN || '30d'

/**
 * Generate a session token (JWT)
 * @param {object} payload - Data to encode in token
 * @param {boolean} rememberMe - Whether to extend expiration
 * @returns {string} JWT token
 */
export const generateSessionToken = (payload, rememberMe = false) => {
  try {
    const expiresIn = rememberMe ? JWT_REMEMBER_EXPIRES_IN : JWT_EXPIRES_IN
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn })
    return token
  } catch (error) {
    console.error('Error generating session token:', error)
    throw new Error('Failed to generate session token')
  }
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
export const verifySessionToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired')
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token')
    }
    console.error('Error verifying token:', error)
    throw new Error('Failed to verify token')
  }
}

/**
 * Generate a password reset token
 * @returns {string} Random token
 */
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash a token for storage
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Get expiration date for session token
 * @param {boolean} rememberMe - Whether to extend expiration
 * @returns {Date} Expiration date
 */
export const getTokenExpiration = (rememberMe = false) => {
  const hours = rememberMe ? 30 * 24 : 24 // 30 days or 24 hours
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

/**
 * Get expiration date for reset token (1 hour)
 * @returns {Date} Expiration date
 */
export const getResetTokenExpiration = () => {
  return new Date(Date.now() + 60 * 60 * 1000) // 1 hour
}
