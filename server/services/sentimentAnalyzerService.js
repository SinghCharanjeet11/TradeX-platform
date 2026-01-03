/**
 * Sentiment Analyzer Service
 * Analyzes sentiment from news articles for assets
 */

import AIInsightsService from './aiInsightsService.js';
import newsService from './newsService.js';
import Sentiment from 'sentiment';

class SentimentAnalyzerService extends AIInsightsService {
  constructor() {
    super('SentimentAnalyzerService');
    this.CACHE_TTL = 1800; // 30 minutes in seconds
    this.sentiment = new Sentiment();
  }

  /**
   * Analyze sentiment from news articles
   * @param {string} symbol - Asset symbol
   * @param {number} hoursBack - How many hours of news to analyze (default: 48)
   * @returns {Promise<Object>} Sentiment analysis data
   */
  async analyzeSentiment(symbol, hoursBack = 48) {
    try {
      this.validateParams({ symbol }, ['symbol']);

      // Generate cache key
      const cacheKey = this.generateCacheKey('sentiment', { symbol, hoursBack });

      // Check cache first
      const cached = this.getCached(cacheKey);
      if (cached && !this.isStale(cached.analyzedAt, 30)) {
        this.logInfo(`Returning cached sentiment for ${symbol}`);
        return cached;
      }

      // Fetch news articles for the symbol
      const articles = await this._fetchNewsArticles(symbol, hoursBack);

      if (!articles || articles.length === 0) {
        return this._noDataResponse(symbol);
      }

      // Analyze sentiment for each article
      const analyzedArticles = articles.map(article => ({
        ...article,
        sentiment: this._analyzeSingleArticle(article)
      }));

      // Calculate overall sentiment score
      const sentimentScore = this._calculateOverallSentiment(analyzedArticles);

      // Determine sentiment category
      const sentiment = this._categorizeSentiment(sentimentScore);

      // Calculate sentiment trend
      const trend = await this._calculateSentimentTrend(symbol, sentimentScore);

      // Get top contributing articles
      const topArticles = this._getTopArticles(analyzedArticles, 5);

      const result = {
        symbol,
        sentimentScore,
        sentiment,
        trend: trend.trend,
        trendChange: trend.change,
        articlesAnalyzed: analyzedArticles.length,
        topArticles,
        analyzedAt: new Date().toISOString()
      };

      // Cache the result
      this.setCached(cacheKey, result, this.CACHE_TTL);

      return result;

    } catch (error) {
      this.logError('Error analyzing sentiment', error);
      throw error;
    }
  }

  /**
   * Calculate sentiment trend over time
   * @param {string} symbol - Asset symbol
   * @param {number} days - Number of days to analyze (default: 7)
   * @returns {Promise<Object>} Sentiment trend data
   */
  async getSentimentTrend(symbol, days = 7) {
    try {
      this.validateParams({ symbol }, ['symbol']);

      // For now, return a simple trend based on current sentiment
      // In production, this would query historical sentiment data
      const currentSentiment = await this.analyzeSentiment(symbol);

      return {
        symbol,
        days,
        trend: currentSentiment.trend,
        trendChange: currentSentiment.trendChange,
        dataPoints: [] // Would contain historical sentiment scores
      };

    } catch (error) {
      this.logError('Error calculating sentiment trend', error);
      throw error;
    }
  }

  /**
   * Get top contributing articles
   * @param {string} symbol - Asset symbol
   * @returns {Promise<Array>} Top articles with sentiment scores
   */
  async getTopArticles(symbol) {
    try {
      this.validateParams({ symbol }, ['symbol']);

      const sentimentAnalysis = await this.analyzeSentiment(symbol);
      return sentimentAnalysis.topArticles;

    } catch (error) {
      this.logError('Error getting top articles', error);
      throw error;
    }
  }

  /**
   * Fetch news articles for the symbol
   * @private
   */
  async _fetchNewsArticles(symbol, hoursBack) {
    try {
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

      // Fetch news articles
      const newsData = await newsService.getNews({
        symbols: [symbol],
        limit: 50
      });

      // Filter articles by time
      const recentArticles = newsData.articles.filter(article => {
        const articleDate = new Date(article.publishedAt || article.published_at);
        return articleDate >= cutoffTime;
      });

      return recentArticles;

    } catch (error) {
      this.logError(`Error fetching news for ${symbol}`, error);
      return [];
    }
  }

  /**
   * Analyze sentiment of a single article
   * @private
   */
  _analyzeSingleArticle(article) {
    const text = `${article.title || ''} ${article.body || article.description || ''}`;
    const result = this.sentiment.analyze(text);

    // Normalize score to -1 to 1 range
    // Sentiment library returns a score that can range widely
    // We'll normalize it based on typical ranges
    const normalizedScore = Math.max(-1, Math.min(1, result.score / 10));

    return {
      score: normalizedScore,
      comparative: result.comparative,
      positive: result.positive,
      negative: result.negative,
      tokens: result.tokens.length
    };
  }

  /**
   * Calculate overall sentiment from analyzed articles
   * @private
   */
  _calculateOverallSentiment(analyzedArticles) {
    if (analyzedArticles.length === 0) {
      return 0;
    }

    // Weight more recent articles higher
    const now = Date.now();
    let weightedSum = 0;
    let totalWeight = 0;

    analyzedArticles.forEach(article => {
      const articleDate = new Date(article.publishedAt || article.published_at);
      const ageHours = (now - articleDate.getTime()) / (1000 * 60 * 60);

      // Exponential decay: newer articles have more weight
      const weight = Math.exp(-ageHours / 24); // Half-life of 24 hours

      weightedSum += article.sentiment.score * weight;
      totalWeight += weight;
    });

    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Ensure score is between -1 and 1
    return Math.max(-1, Math.min(1, overallScore));
  }

  /**
   * Categorize sentiment score
   * @private
   */
  _categorizeSentiment(score) {
    if (score <= -0.2) {
      return 'bearish';
    } else if (score >= 0.2) {
      return 'bullish';
    } else {
      return 'neutral';
    }
  }

  /**
   * Calculate sentiment trend
   * @private
   */
  async _calculateSentimentTrend(symbol, currentScore) {
    // For now, use a simple heuristic based on current score
    // In production, this would compare with historical data

    // Try to get previous sentiment from cache
    const previousKey = this.generateCacheKey('sentiment-previous', { symbol });
    const previous = this.getCached(previousKey);

    let trend = 'stable';
    let change = 0;

    if (previous && previous.sentimentScore !== undefined) {
      change = currentScore - previous.sentimentScore;

      if (Math.abs(change) > 0.1) {
        trend = change > 0 ? 'improving' : 'declining';
      }
    }

    // Store current score as previous for next time
    this.setCached(previousKey, { sentimentScore: currentScore }, this.CACHE_TTL * 2);

    return { trend, change };
  }

  /**
   * Get top contributing articles sorted by sentiment strength
   * @private
   */
  _getTopArticles(analyzedArticles, limit = 5) {
    return analyzedArticles
      .sort((a, b) => {
        // Sort by absolute sentiment score (strongest sentiment first)
        return Math.abs(b.sentiment.score) - Math.abs(a.sentiment.score);
      })
      .slice(0, limit)
      .map(article => ({
        title: article.title,
        source: article.source || 'Unknown',
        sentiment: article.sentiment.score,
        publishedAt: article.publishedAt || article.published_at,
        url: article.url
      }));
  }

  /**
   * Response for no data available
   * @private
   */
  _noDataResponse(symbol) {
    return {
      symbol,
      sentimentScore: 0,
      sentiment: 'neutral',
      trend: 'stable',
      trendChange: 0,
      articlesAnalyzed: 0,
      topArticles: [],
      analyzedAt: new Date().toISOString(),
      error: {
        code: 'NO_DATA',
        message: 'No news articles available for sentiment analysis'
      }
    };
  }
}

// Export singleton instance
const sentimentAnalyzerService = new SentimentAnalyzerService();
export default sentimentAnalyzerService;
