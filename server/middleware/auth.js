import { verifySessionToken, hashToken } from '../services/tokenService.js'
import { findSessionByToken } from '../repositories/sessionRepository.js'
import { findUserById } from '../repositories/userRepository.js'
import sessionService from '../services/sessionService.js'
import { getClientIP } from '../utils/deviceFingerprint.js'

/**
 * Verify session token from cookie
 */
export const verifyAuth = async (req, res, next) => {
  try {
    // Support both cookie and Bearer token for API testing
    let token = req.cookies.session_token
    
    // Debug logging
    console.log('[Auth] Cookies received:', Object.keys(req.cookies))
    console.log('[Auth] Has session_token:', !!token)
    
    // If no cookie, check Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
        console.log('[Auth] Using Bearer token from header')
      }
    }
    
    if (!token) {
      console.log('[Auth] No token found - returning 401')
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
    
    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please sign in again.',
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
    
    // Update session activity
    await sessionService.updateSessionActivity(session.id)
    
    // Detect IP changes and suspicious activity
    const currentIP = getClientIP(req)
    if (currentIP !== session.ip_address) {
      const suspiciousActivity = await sessionService.detectSuspiciousActivity(session.id, currentIP)
      
      if (suspiciousActivity.suspicious) {
        // Log suspicious activity (will be handled by audit logging later)
        console.warn(`[Security] Suspicious activity detected for user ${user.id}:`, suspiciousActivity)
        
        // Optionally, you could require re-authentication for country changes
        // For now, we just log it
      }
    }
    
    // Attach user and session to request
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
