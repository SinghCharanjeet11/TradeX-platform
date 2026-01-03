import sessionService from '../services/sessionService.js'

/**
 * Get all active sessions for the authenticated user
 * GET /api/auth/sessions
 */
async function getSessions(req, res) {
  try {
    const userId = req.user.userId
    const currentSessionId = req.session?.id
    
    const sessions = await sessionService.getUserSessions(userId)
    
    // Mark current session
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.id === currentSessionId
    }))
    
    res.json({
      sessions: sessionsWithCurrent,
      count: sessionsWithCurrent.length
    })
  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(500).json({ message: 'Failed to retrieve sessions' })
  }
}

/**
 * Terminate a specific session
 * DELETE /api/auth/sessions/:id
 */
async function terminateSession(req, res) {
  try {
    const userId = req.user.userId
    const sessionId = req.params.id
    const currentSessionId = req.session?.id
    
    // Prevent terminating current session via this endpoint
    if (sessionId === currentSessionId) {
      return res.status(400).json({ 
        message: 'Cannot terminate current session. Use logout instead.' 
      })
    }
    
    const success = await sessionService.terminateSession(sessionId, userId)
    
    if (!success) {
      return res.status(404).json({ message: 'Session not found' })
    }
    
    res.json({ 
      message: 'Session terminated successfully',
      sessionId 
    })
  } catch (error) {
    console.error('Terminate session error:', error)
    res.status(500).json({ message: 'Failed to terminate session' })
  }
}

/**
 * Terminate all other sessions (keep current session active)
 * DELETE /api/auth/sessions/others
 */
async function terminateOtherSessions(req, res) {
  try {
    const userId = req.user.userId
    const currentSessionId = req.session?.id
    
    if (!currentSessionId) {
      return res.status(400).json({ message: 'No active session found' })
    }
    
    const count = await sessionService.terminateOtherSessions(currentSessionId, userId)
    
    res.json({ 
      message: `Successfully terminated ${count} session(s)`,
      terminatedCount: count
    })
  } catch (error) {
    console.error('Terminate other sessions error:', error)
    res.status(500).json({ message: 'Failed to terminate sessions' })
  }
}

export {
  getSessions,
  terminateSession,
  terminateOtherSessions
}
