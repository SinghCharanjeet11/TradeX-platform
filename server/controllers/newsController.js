/**
 * News Controller
 * Handles HTTP requests for news with enhanced features
 */

import newsService from '../services/newsService.js'
import newsRepository from '../repositories/newsRepository.js'

export class NewsController {
  /**
   * GET /api/news
   * Get all news with filters
   */
  async getNews(req, res) {
    try {
      const filters = {
        category: req.query.category,
        sentiment: req.query.sentiment,
        search: req.query.search,
        symbols: req.query.symbols ? req.query.symbols.split(',') : [],
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
        userId: req.user?.id // For bookmark enrichment
      }

      const result = await newsService.getNews(filters)

      res.json({
        success: true,
        data: result.articles,
        count: result.articles.length,
        cached: result.cached,
        stale: result.stale || false
      })
    } catch (error) {
      console.error('[NewsController] Error getting news:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch news',
        message: error.message
      })
    }
  }

  /**
   * GET /api/news/breaking
   * Get breaking news
   */
  async getBreakingNews(req, res) {
    try {
      const result = await newsService.getBreakingNews()

      res.json({
        success: true,
        data: result.articles,
        cached: result.cached,
        stale: result.stale || false
      })
    } catch (error) {
      console.error('[NewsController] Error getting breaking news:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch breaking news',
        message: error.message
      })
    }
  }

  /**
   * GET /api/news/personalized
   * Get personalized news based on user's holdings and watchlist
   */
  async getPersonalizedNews(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        })
      }

      const result = await newsService.getPersonalizedNews(req.user.id)

      res.json({
        success: true,
        data: result.articles,
        cached: result.cached || false
      })
    } catch (error) {
      console.error('[NewsController] Error getting personalized news:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch personalized news',
        message: error.message
      })
    }
  }

  /**
   * GET /api/news/sentiment
   * Get market sentiment
   */
  async getMarketSentiment(req, res) {
    try {
      const sentiment = await newsService.getMarketSentiment()

      res.json({
        success: true,
        data: sentiment
      })
    } catch (error) {
      console.error('[NewsController] Error getting sentiment:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch market sentiment',
        message: error.message
      })
    }
  }

  /**
   * POST /api/news/bookmarks
   * Toggle bookmark for an article
   */
  async toggleBookmark(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        })
      }

      const { articleId } = req.body

      if (!articleId) {
        return res.status(400).json({
          success: false,
          error: 'Article ID is required'
        })
      }

      // Check if already bookmarked
      const isBookmarked = await newsRepository.isBookmarked(req.user.id, articleId)

      if (isBookmarked) {
        // Remove bookmark
        await newsRepository.removeBookmark(req.user.id, articleId)
        res.json({
          success: true,
          bookmarked: false,
          message: 'Bookmark removed'
        })
      } else {
        // Add bookmark
        await newsRepository.addBookmark(req.user.id, articleId)
        res.json({
          success: true,
          bookmarked: true,
          message: 'Bookmark added'
        })
      }
    } catch (error) {
      console.error('[NewsController] Error toggling bookmark:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to toggle bookmark',
        message: error.message
      })
    }
  }

  /**
   * GET /api/news/bookmarks
   * Get user's bookmarked articles
   */
  async getBookmarks(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        })
      }

      const bookmarkIds = await newsRepository.getBookmarks(req.user.id)

      res.json({
        success: true,
        data: bookmarkIds,
        count: bookmarkIds.length
      })
    } catch (error) {
      console.error('[NewsController] Error getting bookmarks:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch bookmarks',
        message: error.message
      })
    }
  }

  /**
   * DELETE /api/news/bookmarks/:articleId
   * Remove a specific bookmark
   */
  async removeBookmark(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        })
      }

      const { articleId } = req.params

      if (!articleId) {
        return res.status(400).json({
          success: false,
          error: 'Article ID is required'
        })
      }

      const removed = await newsRepository.removeBookmark(req.user.id, articleId)

      if (removed) {
        res.json({
          success: true,
          message: 'Bookmark removed'
        })
      } else {
        res.status(404).json({
          success: false,
          error: 'Bookmark not found'
        })
      }
    } catch (error) {
      console.error('[NewsController] Error removing bookmark:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to remove bookmark',
        message: error.message
      })
    }
  }
}

export default new NewsController()
