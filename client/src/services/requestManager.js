/**
 * RequestManager Service
 * Deduplicates and tracks API requests to prevent redundant calls
 */

class RequestManager {
  constructor() {
    this.pendingRequests = new Map() // key: request signature, value: Promise
    this.lastMinuteRequests = []     // Array of timestamps for rate tracking
  }

  /**
   * Execute request with deduplication
   * @param {String} key - Unique request identifier
   * @param {Function} requestFn - Function that returns a Promise
   * @returns {Promise} Request result
   */
  async execute(key, requestFn) {
    // Check if identical request is in-flight
    if (this.pendingRequests.has(key)) {
      console.log(`[RequestManager] Deduplicating request: ${key}`)
      return this.pendingRequests.get(key)
    }

    // Execute request and store promise
    const promise = requestFn()
      .then(result => {
        this.pendingRequests.delete(key)
        this.trackRequest(key)
        return result
      })
      .catch(error => {
        this.pendingRequests.delete(key)
        throw error
      })

    this.pendingRequests.set(key, promise)
    return promise
  }

  /**
   * Track request for monitoring
   */
  trackRequest(key) {
    const now = Date.now()
    this.lastMinuteRequests.push(now)
    
    // Clean up old requests (older than 1 minute)
    this.lastMinuteRequests = this.lastMinuteRequests.filter(
      time => now - time < 60000
    )

    // Log warning if too many requests
    if (this.lastMinuteRequests.length > 10) {
      console.warn(
        `[RequestManager] High request rate: ${this.lastMinuteRequests.length} requests/min`
      )
    }
  }

  /**
   * Get request statistics
   */
  getStats() {
    return {
      requestsPerMinute: this.lastMinuteRequests.length,
      pendingRequests: this.pendingRequests.size
    }
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pendingRequests.clear()
    this.lastMinuteRequests = []
  }
}

export default new RequestManager()
