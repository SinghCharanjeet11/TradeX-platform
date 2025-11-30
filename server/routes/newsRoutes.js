/**
 * News Routes
 * API routes for news with enhanced features
 */

import express from 'express'
import newsController from '../controllers/newsController.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// Public routes (with optional auth for bookmark enrichment)
router.get('/', optionalAuth, newsController.getNews.bind(newsController))
router.get('/breaking', newsController.getBreakingNews.bind(newsController))
router.get('/sentiment', newsController.getMarketSentiment.bind(newsController))

// Protected routes (require authentication)
router.get('/personalized', requireAuth, newsController.getPersonalizedNews.bind(newsController))
router.get('/bookmarks', requireAuth, newsController.getBookmarks.bind(newsController))
router.post('/bookmarks', requireAuth, newsController.toggleBookmark.bind(newsController))
router.delete('/bookmarks/:articleId', requireAuth, newsController.removeBookmark.bind(newsController))

export default router
