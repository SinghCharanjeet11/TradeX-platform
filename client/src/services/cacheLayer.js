/**
 * CacheLayer Service
 * In-memory caching with TTL for reducing redundant API calls
 */

class CacheLayer {
  constructor() {
    this.cache = new Map()
    this.ttls = {
      portfolio: 30000,        // 30s
      watchlist: 60000,        // 60s
      alerts: 60000,           // 60s
      recommendations: 300000, // 5min
      'dashboard-all': 30000   // 30s for batch endpoint
    }
  }

  /**
   * Get cached data if fresh
   * @param {String} key - Cache key
   * @returns {Object|null} Cached data or null if stale/missing
   */
  get(key) {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    const now = Date.now()
    const age = now - entry.timestamp
    const ttl = this.ttls[key] || 60000

    if (age > ttl) {
      console.log(`[CacheLayer] Cache miss (stale): ${key} (age: ${age}ms, ttl: ${ttl}ms)`)
      this.cache.delete(key)
      return null
    }

    console.log(`[CacheLayer] Cache hit: ${key} (age: ${age}ms)`)
    return entry.data
  }

  /**
   * Set cached data
   * @param {String} key - Cache key
   * @param {Object} data - Data to cache
   */
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
    console.log(`[CacheLayer] Cached: ${key}`)
  }

  /**
   * Invalidate cache entry
   * @param {String} key - Cache key
   */
  invalidate(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
      console.log(`[CacheLayer] Invalidated: ${key}`)
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear()
    console.log('[CacheLayer] Cleared all cache')
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.entries())
    const now = Date.now()
    
    const freshEntries = entries.filter(([key, entry]) => {
      const age = now - entry.timestamp
      const ttl = this.ttls[key] || 60000
      return age <= ttl
    })

    const staleEntries = entries.filter(([key, entry]) => {
      const age = now - entry.timestamp
      const ttl = this.ttls[key] || 60000
      return age > ttl
    })

    return {
      totalEntries: entries.length,
      freshEntries: freshEntries.length,
      staleEntries: staleEntries.length,
      hitRate: freshEntries.length > 0 
        ? ((freshEntries.length / entries.length) * 100).toFixed(1) + '%'
        : '0%'
    }
  }
}

export default new CacheLayer()
