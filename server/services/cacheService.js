/**
 * CacheService - In-memory cache with TTL support
 * Provides temporary storage for API responses to reduce external API calls
 */
class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map();
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if not found/expired
   */
  get(key) {
    if (!this.has(key)) {
      return null;
    }

    if (this.isStale(key)) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlSeconds - Time to live in seconds
   */
  set(key, value, ttlSeconds) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, value);
    this.ttls.set(key, expiresAt);
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.ttls.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.ttls.clear();
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Check if cached value is stale (expired)
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  isStale(key) {
    if (!this.ttls.has(key)) {
      return true;
    }

    const expiresAt = this.ttls.get(key);
    return Date.now() > expiresAt;
  }

  /**
   * Get cache age in seconds
   * @param {string} key - Cache key
   * @returns {number|null} Age in seconds or null if not found
   */
  getCacheAge(key) {
    if (!this.ttls.has(key)) {
      return null;
    }

    const expiresAt = this.ttls.get(key);
    const now = Date.now();
    
    // Calculate how long ago it was cached
    // This is approximate based on TTL
    return Math.floor((now - (expiresAt - this.getOriginalTTL(key) * 1000)) / 1000);
  }

  /**
   * Get original TTL (helper method)
   * @private
   */
  getOriginalTTL(key) {
    // Store TTL separately if needed for accurate age calculation
    // For now, return approximate based on remaining time
    if (!this.ttls.has(key)) {
      return 0;
    }
    const expiresAt = this.ttls.get(key);
    const remainingMs = expiresAt - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
const cacheService = new CacheService();
export default cacheService;
