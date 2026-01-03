import crypto from 'crypto'
import * as sessionRepository from '../repositories/sessionRepository.js'
import { createSessionMetadata, getLocationFromIP } from '../utils/deviceFingerprint.js'

// Session configuration
const SESSION_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds
const MAX_CONCURRENT_SESSIONS = 5

/**
 * Create a new session with device fingerprinting
 * @param {string} userId - User ID
 * @param {Object} req - Express request object
 * @param {boolean} rememberMe - Whether to extend session duration
 * @returns {Promise<Object>} Created session with token
 */
async function createSession(userId, req, rememberMe = false) {
  // Generate session token
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  
  // Extract device metadata
  const metadata = createSessionMetadata(req)
  
  // Calculate expiration
  const duration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : SESSION_DURATION // 30 days or 30 minutes
  const expiresAt = new Date(Date.now() + duration)
  
  // Check concurrent session limit
  const sessionCount = await sessionRepository.countUserSessions(userId)
  if (sessionCount >= MAX_CONCURRENT_SESSIONS) {
    // Remove oldest session
    const oldestSession = await sessionRepository.getOldestSession(userId)
    if (oldestSession) {
      await sessionRepository.terminateSession(oldestSession.id, userId)
    }
  }
  
  // Create session in database
  const session = await sessionRepository.createSession({
    userId,
    tokenHash,
    expiresAt,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    deviceFingerprint: metadata.deviceFingerprint,
    deviceType: metadata.deviceType,
    browser: metadata.browser,
    os: metadata.os,
    locationCountry: metadata.locationCountry,
    locationCity: metadata.locationCity
  })
  
  return {
    session,
    token // Return unhashed token for client
  }
}

/**
 * Get all active sessions for a user with formatted data
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of formatted sessions
 */
async function getUserSessions(userId) {
  const sessions = await sessionRepository.getUserSessions(userId)
  
  return sessions.map(session => ({
    id: session.id,
    deviceType: session.device_type || 'Unknown',
    browser: session.browser || 'Unknown',
    os: session.os || 'Unknown',
    ipAddress: session.ip_address,
    location: `${session.location_city || 'Unknown'}, ${session.location_country || 'Unknown'}`,
    lastActivity: session.last_activity,
    createdAt: session.created_at,
    expiresAt: session.expires_at,
    isCurrent: false // Will be set by controller based on current session
  }))
}

/**
 * Terminate a specific session with validation
 * @param {string} sessionId - Session ID to terminate
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<boolean>} Success status
 */
async function terminateSession(sessionId, userId) {
  return await sessionRepository.terminateSession(sessionId, userId)
}

/**
 * Terminate all sessions except the current one
 * @param {string} currentSessionId - Current session ID to preserve
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of terminated sessions
 */
async function terminateOtherSessions(currentSessionId, userId) {
  return await sessionRepository.terminateOtherSessions(currentSessionId, userId)
}

/**
 * Update session activity timestamp
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} Success status
 */
async function updateSessionActivity(sessionId) {
  return await sessionRepository.updateSessionActivity(sessionId)
}

/**
 * Detect suspicious session activity (IP changes, unusual patterns)
 * @param {string} sessionId - Session ID
 * @param {string} newIpAddress - New IP address from request
 * @returns {Promise<Object>} Detection result with suspicious flag and details
 */
async function detectSuspiciousActivity(sessionId, newIpAddress) {
  const session = await sessionRepository.getSessionDetails(sessionId)
  
  if (!session) {
    return { suspicious: false, reason: 'Session not found' }
  }
  
  // Check for IP address change
  if (session.ip_address !== newIpAddress) {
    const oldLocation = {
      country: session.location_country,
      city: session.location_city
    }
    
    const newLocation = getLocationFromIP(newIpAddress)
    
    // Update session with new IP
    await sessionRepository.updateSessionIP(
      sessionId,
      newIpAddress,
      newLocation.countryCode,
      newLocation.city
    )
    
    // Flag as suspicious if country changed
    if (oldLocation.country !== newLocation.countryCode) {
      return {
        suspicious: true,
        reason: 'IP_CHANGE_DIFFERENT_COUNTRY',
        details: {
          oldIP: session.ip_address,
          newIP: newIpAddress,
          oldLocation: `${oldLocation.city}, ${oldLocation.country}`,
          newLocation: `${newLocation.city}, ${newLocation.countryCode}`
        }
      }
    }
    
    return {
      suspicious: true,
      reason: 'IP_CHANGE_SAME_COUNTRY',
      details: {
        oldIP: session.ip_address,
        newIP: newIpAddress,
        location: `${newLocation.city}, ${newLocation.countryCode}`
      }
    }
  }
  
  return { suspicious: false }
}

/**
 * Clean up expired sessions (scheduled job)
 * @returns {Promise<number>} Number of cleaned up sessions
 */
async function cleanupExpiredSessions() {
  const count = await sessionRepository.cleanupExpiredSessions()
  console.log(`[Session Cleanup] Removed ${count} expired sessions`)
  return count
}

/**
 * Get session details by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object|null>} Session details or null
 */
async function getSessionDetails(sessionId) {
  return await sessionRepository.getSessionDetails(sessionId)
}

/**
 * Validate session token and return session info
 * @param {string} token - Session token
 * @returns {Promise<Object|null>} Session info or null if invalid
 */
async function validateSessionToken(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const session = await sessionRepository.findSessionByToken(tokenHash)
  
  if (!session) {
    return null
  }
  
  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    await sessionRepository.deleteSession(tokenHash)
    return null
  }
  
  // Update last activity
  await updateSessionActivity(session.id)
  
  return session
}

/**
 * Invalidate all sessions for a user (e.g., after password change)
 * @param {string} userId - User ID
 * @param {string} exceptSessionId - Session ID to preserve (optional)
 * @returns {Promise<number>} Number of invalidated sessions
 */
async function invalidateAllUserSessions(userId, exceptSessionId = null) {
  if (exceptSessionId) {
    return await sessionRepository.terminateOtherSessions(exceptSessionId, userId)
  }
  return await sessionRepository.deleteAllUserSessions(userId)
}

export default {
  createSession,
  getUserSessions,
  terminateSession,
  terminateOtherSessions,
  updateSessionActivity,
  detectSuspiciousActivity,
  cleanupExpiredSessions,
  getSessionDetails,
  validateSessionToken,
  invalidateAllUserSessions
}
