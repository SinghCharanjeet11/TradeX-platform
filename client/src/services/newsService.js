/**
 * News Service
 * API client for news
 */

import api from './api'

const newsService = {
  /**
   * Get all news with filters
   */
  async getNews(filters = {}) {
    try {
      const params = new URLSearchParams()
      
      if (filters.category) params.append('category', filters.category)
      if (filters.sentiment) params.append('sentiment', filters.sentiment)
      if (filters.search) params.append('search', filters.search)
      if (filters.symbols) params.append('symbols', filters.symbols.join(','))

      const response = await api.get(`/news?${params.toString()}`)
      return {
        success: true,
        data: response.data.data
      }
    } catch (error) {
      console.error('[newsService] Error getting news:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch news'
      }
    }
  },

  /**
   * Get breaking news
   */
  async getBreakingNews() {
    try {
      const response = await api.get('/news/breaking')
      return {
        success: true,
        data: response.data.data
      }
    } catch (error) {
      console.error('[newsService] Error getting breaking news:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch breaking news'
      }
    }
  },

  /**
   * Get personalized news
   */
  async getPersonalizedNews(symbols = []) {
    try {
      const params = symbols.length > 0 ? `?symbols=${symbols.join(',')}` : ''
      const response = await api.get(`/news/personalized${params}`)
      return {
        success: true,
        data: response.data.data
      }
    } catch (error) {
      console.error('[newsService] Error getting personalized news:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch personalized news'
      }
    }
  },

  /**
   * Get market sentiment
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
   * Format date
   */
  formatDate(date) {
    const now = new Date()
    const newsDate = new Date(date)
    const diffMs = now - newsDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return newsDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }
}

export default newsService
