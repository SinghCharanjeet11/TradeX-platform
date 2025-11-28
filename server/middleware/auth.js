import { verifySessionToken, hashToken } from '../services/tokenService.js'
import { findSessionByToken } from '../repositories/sessionRepository.js'
import { findUserById } from '../repositories/userRepository.js'

/**
 * Verify session token from cookie
 */
export const verifyAuth = async (req, res, next) => {
  try {
    // Support both cookie and Bearer token for API testing
    let token = req.cookies.session_token
    
    // If no cookie, check Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      })
    }
    
    // Verify JWT token
    const decoded = verifySessionToken(token)
    
    // Check if session exists in database
    const tokenHash = hashToken(token)
    const session = await findSessionByToken(tokenHash)
    
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session',
      })
    }
    
    // Get user data
    const user = await findUserById(session.user_id)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      })
    }
    
    // Attach user to request
    req.user = user
    req.session = session
    
    next()
  } catch (error) {
    if (error.message === 'Token expired') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please sign in again.',
      })
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication',
    })
  }
}

/**
 * Optional authentication - doesn't fail if not authenticated
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.session_token
    
    if (!token) {
      return next()
    }
    
    const decoded = verifySessionToken(token)
    const tokenHash = hashToken(token)
    const session = await findSessionByToken(tokenHash)
    
    if (session) {
      const user = await findUserById(session.user_id)
      if (user) {
        req.user = user
        req.session = session
      }
    }
    
    next()
  } catch (error) {
    // Silently fail for optional auth
    next()
  }
}

/**
 * Require authentication
 */
export const requireAuth = verifyAuth
