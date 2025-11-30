/**
 * News Service
 * API client for news with enhanced features
 */

import api from './api'

const newsService = {
  /**
   * Get all news with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<{success: boolean, data: Article[], cached: boolean, stale: boolean}>}
   */
  async getNews(filters = {}) {
    try {
      const params = new URLSearchParams()
      
      if (filters.category) params.append('category', filters.category)
      if (filters.sentiment) params.append('sentiment', filters.sentiment)
      if (filters.search) params.append('search', filters.search)
      if (filters.symbols) params.append('symbols', filters.symbols.join(','))
      if (filters.limit) params.append('limit', filters.limit)

      const response = await api.get(`/news?${params.toString()}`)
      return {
        success: true,
        data: response.data.data,
        cached: response.data.cached || false,
        stale: response.data.stale || false,
        count: response.data.count
      }
    } catch (error) {
      console.error('[newsService] Error getting news:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch news',
        data: []
      }
    }
  },

  /**
   * Get breaking news
   * @returns {Promise<{success: boolean, data: Article[]}>}
   */
  async getBreakingNews() {
    try {
      const response = await api.get('/news/breaking')
      return {
        success: true,
        data: response.data.data,
        cached: response.data.cached || false
      }
    } catch (error) {
      console.error('[newsService] Error getting breaking news:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch breaking news',
        data: []
      }
    }
  },

  /**
   * Get personalized news based on user's portfolio
   * @returns {Promise<{success: boolean, data: Article[]}>}
   */
  async getPersonalizedNews() {
    try {
      const response = await api.get('/news/personalized')
      return {
        success: true,
        data: response.data.data,
        cached: response.data.cached || false
      }
    } catch (error) {
      console.error('[newsService] Error getting personalized news:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch personalized news',
        data: []
      }
    }
  },

  /**
   * Get market sentiment
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  async getMarketSentiment() {
    try {
      const response = await api.get('/news/sentiment')
      return {
        success: true,
        data: response.data.data
      }
    } catch (error) {
      console.error('[newsService] Error getting sentiment:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch sentiment'
      }
    }
  },

  /**
   * Toggle bookmark for an article
   * @param {string} articleId - Article ID
   * @returns {Promise<{success: boolean, bookmarked: boolean}>}
   */
  async toggleBookmark(articleId) {
    try {
      const response = await api.post('/news/bookmarks', { articleId })
      return {
        success: true,
        bookmarked: response.data.bookmarked,
        message: response.data.message
      }
    } catch (error) {
      console.error('[newsService] Error toggling bookmark:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to toggle bookmark'
      }
    }
  },

  /**
   * Get user's bookmarked articles
   * @returns {Promise<{success: boolean, data: string[]}>}
   */
  async getBookmarks() {
    try {
      const response = await api.get('/news/bookmarks')
      return {
        success: true,
        data: response.data.data
      }
    } catch (error) {
      console.error('[newsService] Error getting bookmarks:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch bookmarks',
        data: []
      }
    }
  },

  /**
   * Remove a bookmark
   * @param {string} articleId - Article ID
   * @returns {Promise<{success: boolean}>}
   */
  async removeBookmark(articleId) {
    try {
      const response = await api.delete(`/news/bookmarks/${articleId}`)
      return {
        success: true,
        message: response.data.message
      }
    } catch (error) {
      console.error('[newsService] Error removing bookmark:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to remove bookmark'
      }
    }
  },

  /**
   * Format date for display
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  formatDate(date) {
    const now = new Date()
    const newsDate = new Date(date)
    const diffMs = now - newsDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return newsDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: newsDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  },

  /**
   * Get sentiment label from score
   * @param {number} score - Sentiment score (-1 to 1)
   * @returns {string} Sentiment label
   */
  getSentimentLabel(score) {
    if (score > 0.3) return 'positive'
    if (score < -0.3) return 'negative'
    return 'neutral'
  },

  /**
   * Get sentiment color from score
   * @param {number} score - Sentiment score (-1 to 1)
   * @returns {string} Color class
   */
  getSentimentColor(score) {
    if (score > 0.3) return 'green'
    if (score < -0.3) return 'red'
    return 'gray'
  }
}

export default newsService
