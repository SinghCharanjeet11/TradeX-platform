import sessionService from '../services/sessionService.js'

/**
 * Session cleanup job
 * Runs periodically to remove expired sessions from the database
 */
class SessionCleanupJob {
  constructor() {
    this.intervalId = null
    this.isRunning = false
    // Run every hour (3600000 ms)
    this.interval = 60 * 60 * 1000
  }

  /**
   * Start the cleanup job
   */
  start() {
    if (this.isRunning) {
      console.log('[Session Cleanup] Job is already running')
      return
    }

    console.log('[Session Cleanup] Starting session cleanup job (runs every hour)')
    
    // Run immediately on start
    this.runCleanup()
    
    // Then run on interval
    this.intervalId = setInterval(() => {
      this.runCleanup()
    }, this.interval)
    
    this.isRunning = true
  }

  /**
   * Stop the cleanup job
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      this.isRunning = false
      console.log('[Session Cleanup] Session cleanup job stopped')
    }
  }

  /**
   * Run the cleanup process
   */
  async runCleanup() {
    try {
      const startTime = Date.now()
      console.log('[Session Cleanup] Running session cleanup...')
      
      const deletedCount = await sessionService.cleanupExpiredSessions()
      
      const duration = Date.now() - startTime
      console.log(`[Session Cleanup] Completed in ${duration}ms. Removed ${deletedCount} expired session(s)`)
    } catch (error) {
      console.error('[Session Cleanup] Error during cleanup:', error)
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.interval,
      nextRun: this.intervalId ? new Date(Date.now() + this.interval) : null
    }
  }
}

// Create singleton instance
const sessionCleanupJob = new SessionCleanupJob()

export default sessionCleanupJob
