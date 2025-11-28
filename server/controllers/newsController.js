/**
 * News Controller
 * Handles HTTP requests for news
 */

import newsService from '../services/newsService.js'

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
        symbols: req.query.symbols ? req.query.symbols.split(',') : []
      }

      const news = await newsService.getNews(filters)

      res.json({
        success: true,
        data: news,
        count: news.length
      })
    } catch (error) {
      console.error('[NewsController] Error getting news:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch news'
      })
    }
  }

  /**
   * GET /api/news/breaking
   * Get breaking news
   */
  async getBreakingNews(req, res) {
    try {
      const news = await newsService.getBreakingNews()

      res.json({
        success: true,
        data: news
      })
    } catch (error) {
      console.error('[NewsController] Error getting breaking news:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch breaking news'
      })
    }
  }

  /**
   * GET /api/news/personalized
   * Get personalized news based on holdings
   */
  async getPersonalizedNews(req, res) {
    try {
      const symbols = req.query.symbols ? req.query.symbols.split(',') : []
      const news = await newsService.getPersonalizedNews(symbols)

      res.json({
        success: true,
        data: news
      })
    } catch (error) {
      console.error('[NewsController] Error getting personalized news:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch personalized news'
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
        error: 'Failed to fetch market sentiment'
      })
    }
  }
}

export default new NewsController()
