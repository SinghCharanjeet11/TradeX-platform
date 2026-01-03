/**
 * News Service
 * Handles news fetching, filtering, and caching with real API integration
 */

import newsProvider from '../providers/newsProvider.js'
import newsRepository from '../repositories/newsRepository.js'
import cacheService from './cacheService.js'
import holdingsRepository from '../repositories/holdingsRepository.js'
import watchlistRepository from '../repositories/watchlistRepository.js'

const CACHE_TTL = parseInt(process.env.NEWS_CACHE_TTL) || 300 // 5 minutes
const STALE_CACHE_TTL = parseInt(process.env.NEWS_STALE_CACHE_TTL) || 3600 // 1 hour
const CACHE_KEY_PREFIX = 'news:'

export class NewsService {
  constructor() {
    this.lastFetchTime = null
    this.retryTimeout = null
  }

  /**
   * Get all news with optional filters and caching
   * @param {Object} filters - Filter options
   * @returns {Promise<{articles: Article[], cached: boolean, stale: boolean}>}
   */
  async getNews(filters = {}) {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}all:${JSON.stringify(filters)}`
      
      // Try to get from cache first
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        const age = Date.now() - cached.timestamp
        if (age < CACHE_TTL * 1000) {
          console.log('[NewsService] Serving from fresh cache')
          return {
            articles: await this.enrichArticles(cached.data, filters.userId),
            cached: true,
            stale: false
          }
        }
      }

      // Fetch from provider
      try {
        const articles = await newsProvider.getNews({
          categories: filters.category ? [filters.category] : undefined,
          symbols: filters.symbols,
          limit: filters.limit || 50
        })

        // Calculate sentiment for each article
        const enrichedArticles = articles.map(article => ({
          ...article,
          sentiment: this.calculateSentiment(article.body)
        }))

        // Cache the results
        await cacheService.set(cacheKey, enrichedArticles, CACHE_TTL)
        this.lastFetchTime = Date.now()

        // Apply client-side filters
        let filtered = this.applyFilters(enrichedArticles, filters)

        return {
          articles: await this.enrichArticles(filtered, filters.userId),
          cached: false,
          stale: false
        }

      } catch (providerError) {
        console.error('[NewsService] Provider error, trying stale cache:', providerError.message)
        
        // Try to serve stale cache
        if (cached) {
          const age = Date.now() - cached.timestamp
          if (age < STALE_CACHE_TTL * 1000) {
            console.log('[NewsService] Serving from stale cache')
            return {
              articles: await this.enrichArticles(cached.data, filters.userId),
              cached: true,
              stale: true
            }
          }
        }

        // Schedule retry
        this.scheduleRetry()
        throw providerError
      }

    } catch (error) {
      console.error('[NewsService] Error getting news:', error)
      throw new Error(`Failed to fetch news: ${error.message}`)
    }
  }

  /**
   * Apply filters to articles
   * @param {Article[]} articles - Articles to filter
   * @param {Object} filters - Filter criteria
   * @returns {Article[]}
   */
  applyFilters(articles, filters) {
    let filtered = [...articles]

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(article => {
        // Check both singular category and categories array
        if (article.categories && Array.isArray(article.categories)) {
          return article.categories.some(cat => 
            cat.toLowerCase() === filters.category.toLowerCase()
          )
        }
        if (article.category) {
          return article.category.toLowerCase() === filters.category.toLowerCase()
        }
        return false
      })
    }

    // Filter by sentiment
    if (filters.sentiment && filters.sentiment !== 'all') {
      filtered = filtered.filter(article => {
        const sentiment = article.sentiment
        if (filters.sentiment === 'positive') return sentiment > 0.3
        if (filters.sentiment === 'negative') return sentiment < -0.3
        if (filters.sentiment === 'neutral') return sentiment >= -0.3 && sentiment <= 0.3
        return true
      })
    }

    // Filter by search query
    if (filters.search) {
      filtered = this.filterBySearch(filtered, filters.search)
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

    return filtered
  }

  /**
   * Enrich articles with bookmark status
   * @param {Article[]} articles - Articles to enrich
   * @param {number} userId - User ID
   * @returns {Promise<Article[]>}
   */
  async enrichArticles(articles, userId) {
    if (!userId || !articles || articles.length === 0) {
      return articles
    }

    try {
      const articleIds = articles.map(a => a.id)
      const bookmarked = await newsRepository.getBookmarkedArticles(userId, articleIds)

      return articles.map(article => ({
        ...article,
        isBookmarked: bookmarked.has(article.id)
      }))
    } catch (error) {
      console.error('[NewsService] Error enriching articles:', error)
      return articles
    }
  }

  /**
   * Get breaking news (last 2 hours) with caching
   * @returns {Promise<{articles: Article[], cached: boolean}>}
   */
  async getBreakingNews() {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}breaking`
      
      // Try cache first (shorter TTL for breaking news)
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        const age = Date.now() - cached.timestamp
        if (age < 120 * 1000) { // 2 minutes for breaking news
          return {
            articles: cached.data,
            cached: true
          }
        }
      }

      // Fetch from provider
      const articles = await newsProvider.getBreakingNews()

      // Calculate sentiment
      const enrichedArticles = articles.map(article => ({
        ...article,
        sentiment: this.calculateSentiment(article.body)
      }))

      // Cache for 2 minutes
      await cacheService.set(cacheKey, enrichedArticles, 120)

      return {
        articles: enrichedArticles,
        cached: false
      }

    } catch (error) {
      console.error('[NewsService] Error getting breaking news:', error)
      
      // Try to serve stale cache
      const cached = await cacheService.get(`${CACHE_KEY_PREFIX}breaking`)
      if (cached) {
        return {
          articles: cached.data,
          cached: true,
          stale: true
        }
      }

      throw new Error(`Failed to fetch breaking news: ${error.message}`)
    }
  }

  /**
   * Get personalized news based on user's holdings and watchlist
   * @param {number} userId - User ID
   * @returns {Promise<Article[]>}
   */
  async getPersonalizedNews(userId) {
    try {
      // Get user's holdings and watchlist
      const [holdings, watchlist] = await Promise.all([
        holdingsRepository.getUserHoldings(userId).catch(() => []),
        watchlistRepository.getUserWatchlist(userId).catch(() => [])
      ])

      // Extract symbols
      const holdingSymbols = holdings.map(h => h.symbol)
      const watchlistSymbols = watchlist.map(w => w.symbol)
      const allSymbols = [...new Set([...holdingSymbols, ...watchlistSymbols])]

      if (allSymbols.length === 0) {
        // Return general news if no symbols
        return this.getNews({ limit: 20 })
      }

      const cacheKey = `${CACHE_KEY_PREFIX}personalized:${userId}`
      
      // Try cache
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        const age = Date.now() - cached.timestamp
        if (age < CACHE_TTL * 1000) {
          return {
            articles: await this.enrichArticles(cached.data, userId),
            cached: true
          }
        }
      }

      // Fetch news for user's symbols
      const articles = await newsProvider.getNewsBySymbols(allSymbols)

      // Calculate sentiment and prioritize
      const enrichedArticles = articles.map(article => {
        const matchedSymbols = article.symbols.filter(s => allSymbols.includes(s))
        return {
          ...article,
          sentiment: this.calculateSentiment(article.body),
          matchedSymbols,
          relevanceScore: matchedSymbols.length
        }
      })

      // Sort by relevance and date
      enrichedArticles.sort((a, b) => {
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore
        }
        return new Date(b.publishedAt) - new Date(a.publishedAt)
      })

      // Cache results
      await cacheService.set(cacheKey, enrichedArticles, CACHE_TTL)

      return {
        articles: await this.enrichArticles(enrichedArticles, userId),
        cached: false
      }

    } catch (error) {
      console.error('[NewsService] Error getting personalized news:', error)
      throw new Error(`Failed to fetch personalized news: ${error.message}`)
    }
  }

  /**
   * Calculate sentiment score for article content
   * Simple sentiment analysis based on keyword matching
   * @param {string} content - Article content
   * @returns {number} Score between -1 and 1
   */
  calculateSentiment(content) {
    if (!content) return 0

    const contentLower = content.toLowerCase()

    // Positive keywords
    const positiveKeywords = [
      'surge', 'gain', 'profit', 'growth', 'success', 'bullish', 'rally',
      'breakthrough', 'record', 'high', 'positive', 'upgrade', 'strong',
      'beat', 'exceed', 'optimistic', 'recovery', 'boom', 'soar'
    ]

    // Negative keywords
    const negativeKeywords = [
      'drop', 'fall', 'loss', 'decline', 'crash', 'bearish', 'concern',
      'risk', 'negative', 'downgrade', 'weak', 'miss', 'fail', 'pessimistic',
      'recession', 'crisis', 'plunge', 'tumble', 'slump'
    ]

    let positiveCount = 0
    let negativeCount = 0

    positiveKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      const matches = contentLower.match(regex)
      if (matches) positiveCount += matches.length
    })

    negativeKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      const matches = contentLower.match(regex)
      if (matches) negativeCount += matches.length
    })

    const total = positiveCount + negativeCount
    if (total === 0) return 0

    // Calculate score between -1 and 1
    const score = (positiveCount - negativeCount) / total
    return Math.max(-1, Math.min(1, score))
  }

  /**
   * Filter articles by search query
   * Supports multi-word search with OR logic
   * @param {Article[]} articles - Articles to filter
   * @param {string} query - Search query
   * @returns {Article[]}
   */
  filterBySearch(articles, query) {
    if (!query || query.trim() === '') {
      return articles
    }

    const searchTerms = query.toLowerCase().trim().split(/\s+/)

    return articles.filter(article => {
      const titleLower = article.title.toLowerCase()
      const bodyLower = article.body.toLowerCase()

      // Match if any search term is found in title or body
      return searchTerms.some(term => 
        titleLower.includes(term) || bodyLower.includes(term)
      )
    })
  }

  /**
   * Schedule retry after provider failure
   */
  scheduleRetry() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }

    this.retryTimeout = setTimeout(() => {
      console.log('[NewsService] Retry timeout expired, ready for next request')
      this.retryTimeout = null
    }, 30000) // 30 seconds
  }

  /**
   * Get market sentiment summary
   * @returns {Promise<Object>}
   */
  async getMarketSentiment() {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}sentiment`
      
      // Try cache
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        const age = Date.now() - cached.timestamp
        if (age < CACHE_TTL * 1000) {
          return cached.data
        }
      }

      // Get recent news
      const { articles } = await this.getNews({ limit: 50 })
      
      const sentimentCounts = {
        positive: 0,
        neutral: 0,
        negative: 0
      }

      articles.forEach(article => {
        const sentiment = article.sentiment
        if (sentiment > 0.3) sentimentCounts.positive++
        else if (sentiment < -0.3) sentimentCounts.negative++
        else sentimentCounts.neutral++
      })

      const total = articles.length
      const avgSentiment = articles.reduce((sum, a) => sum + a.sentiment, 0) / total

      const result = {
        score: avgSentiment,
        positive: sentimentCounts.positive,
        neutral: sentimentCounts.neutral,
        negative: sentimentCounts.negative,
        total,
        sentiment: avgSentiment > 0.2 ? 'bullish' : avgSentiment < -0.2 ? 'bearish' : 'neutral'
      }

      // Cache for 5 minutes
      await cacheService.set(cacheKey, result, CACHE_TTL)

      return result

    } catch (error) {
      console.error('[NewsService] Error getting market sentiment:', error)
      throw new Error(`Failed to calculate market sentiment: ${error.message}`)
    }
  }
}

export default new NewsService()
