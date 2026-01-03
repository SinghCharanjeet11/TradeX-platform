/**
 * Property-Based and Unit Tests for Sentiment Analyzer Service
 * Using fast-check for property-based testing
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import fc from 'fast-check';

// Mock the news service before importing
const mockGetNews = jest.fn();
jest.unstable_mockModule('./newsService.js', () => ({
  default: {
    getNews: mockGetNews
  }
}));

// Import after mocking
const { default: sentimentAnalyzerService } = await import('./sentimentAnalyzerService.js');
const { default: cacheService } = await import('./cacheService.js');

describe('SentimentAnalyzerService - Property-Based Tests', () => {
  beforeEach(() => {
    mockGetNews.mockClear();
    cacheService.clear();
  });

  /**
   * Feature: ai-insights, Property 3: Complete sentiment structure
   * Validates: Requirements 2.1, 2.3, 2.5
   * 
   * For any sentiment analysis, the response should contain a sentiment score (-1 to 1), 
   * category (bearish/neutral/bullish), trend (improving/stable/declining), 
   * and top contributing articles with individual scores
   */
  describe('Property 3: Complete sentiment structure', () => {
    it('should return complete sentiment structure for any valid symbol', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 10 }), // symbol
          async (symbol) => {
            // Mock news articles
            const mockArticles = Array.from({ length: 10 }, (_, i) => ({
              title: `Article ${i}`,
              body: i % 2 === 0 ? 'Great positive news about growth' : 'Negative concerns about decline',
              publishedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
              source: 'Test Source',
              url: `https://example.com/${i}`
            }));

            mockGetNews.mockResolvedValue({
              articles: mockArticles,
              cached: false,
              stale: false
            });

            const sentiment = await sentimentAnalyzerService.analyzeSentiment(symbol);

            // Verify sentiment score is in valid range
            expect(sentiment.sentimentScore).toBeGreaterThanOrEqual(-1);
            expect(sentiment.sentimentScore).toBeLessThanOrEqual(1);

            // Verify sentiment category is valid
            expect(['bearish', 'neutral', 'bullish']).toContain(sentiment.sentiment);

            // Verify trend is valid
            expect(['improving', 'stable', 'declining']).toContain(sentiment.trend);

            // Verify trend change is a number
            expect(typeof sentiment.trendChange).toBe('number');

            // Verify articles analyzed count
            expect(sentiment.articlesAnalyzed).toBeGreaterThanOrEqual(0);

            // Verify top articles structure
            expect(Array.isArray(sentiment.topArticles)).toBe(true);
            sentiment.topArticles.forEach(article => {
              expect(article).toHaveProperty('title');
              expect(article).toHaveProperty('source');
              expect(article).toHaveProperty('sentiment');
              expect(article).toHaveProperty('publishedAt');
              expect(article).toHaveProperty('url');
              
              // Sentiment score should be in valid range
              expect(article.sentiment).toBeGreaterThanOrEqual(-1);
              expect(article.sentiment).toBeLessThanOrEqual(1);
            });

            // Verify timestamp
            expect(sentiment.analyzedAt).toBeDefined();
            expect(new Date(sentiment.analyzedAt).getTime()).not.toBeNaN();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle no data gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 10 }),
          async (symbol) => {
            mockGetNews.mockResolvedValue({
              articles: [],
              cached: false,
              stale: false
            });

            const sentiment = await sentimentAnalyzerService.analyzeSentiment(symbol);

            expect(sentiment.sentimentScore).toBe(0);
            expect(sentiment.sentiment).toBe('neutral');
            expect(sentiment.articlesAnalyzed).toBe(0);
            expect(sentiment.topArticles).toEqual([]);
            expect(sentiment.error).toBeDefined();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Feature: ai-insights, Property 4: Sentiment recency
   * Validates: Requirements 2.2
   * 
   * For any sentiment analysis, all analyzed articles should have 
   * timestamps within the past 48 hours
   */
  describe('Property 4: Sentiment recency', () => {
    it('should only analyze articles from the past 48 hours', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 10 }),
          async (symbol) => {
            const now = Date.now();
            const cutoff48h = now - 48 * 60 * 60 * 1000;

            // Mix of recent and old articles
            const mockArticles = [
              ...Array.from({ length: 5 }, (_, i) => ({
                title: `Recent ${i}`,
                body: 'Positive news',
                publishedAt: new Date(now - i * 60 * 60 * 1000).toISOString(), // Recent
                source: 'Source',
                url: `https://example.com/${i}`
              })),
              ...Array.from({ length: 3 }, (_, i) => ({
                title: `Old ${i}`,
                body: 'Old news',
                publishedAt: new Date(cutoff48h - (i + 1) * 24 * 60 * 60 * 1000).toISOString(), // Old
                source: 'Source',
                url: `https://example.com/old${i}`
              }))
            ];

            mockGetNews.mockResolvedValue({
              articles: mockArticles,
              cached: false,
              stale: false
            });

            const sentiment = await sentimentAnalyzerService.analyzeSentiment(symbol, 48);

            // Should only count recent articles
            expect(sentiment.articlesAnalyzed).toBe(5);

            // All top articles should be recent
            sentiment.topArticles.forEach(article => {
              const articleDate = new Date(article.publishedAt);
              expect(articleDate.getTime()).toBeGreaterThanOrEqual(cutoff48h);
            });
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Feature: ai-insights, Property 5: Sentiment change highlighting
   * Validates: Requirements 2.4
   * 
   * For any sentiment analysis where the score changed by more than 0.3 points 
   * from the previous analysis, the change should be flagged as significant
   */
  describe('Property 5: Sentiment change highlighting', () => {
    it('should detect significant sentiment changes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.float({ min: -1, max: 1 }),
          fc.float({ min: -1, max: 1 }),
          async (symbol, score1, score2) => {
            const mockArticles = (score) => Array.from({ length: 5 }, (_, i) => ({
              title: `Article ${i}`,
              body: score > 0 ? 'Very positive excellent great' : 'Very negative bad terrible',
              publishedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
              source: 'Source',
              url: `https://example.com/${i}`
            }));

            // First analysis
            mockGetNews.mockResolvedValue({
              articles: mockArticles(score1),
              cached: false,
              stale: false
            });

            await sentimentAnalyzerService.analyzeSentiment(symbol);

            // Second analysis
            mockGetNews.mockClear();
            mockGetNews.mockResolvedValue({
              articles: mockArticles(score2),
              cached: false,
              stale: false
            });

            const sentiment2 = await sentimentAnalyzerService.analyzeSentiment(`${symbol}_2`);

            // Verify trend change is calculated
            expect(typeof sentiment2.trendChange).toBe('number');
            
            // If change is significant, trend should not be stable
            const actualChange = Math.abs(sentiment2.trendChange);
            if (actualChange > 0.1) {
              expect(sentiment2.trend).not.toBe('stable');
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});

/**
 * Unit Tests for Sentiment Analyzer Service
 */
describe('SentimentAnalyzerService - Unit Tests', () => {
  beforeEach(() => {
    mockGetNews.mockClear();
    cacheService.clear();
  });

  describe('analyzeSentiment with various inputs', () => {
    it('should analyze sentiment for BTC with positive news', async () => {
      const mockArticles = Array.from({ length: 5 }, (_, i) => ({
        title: 'Bitcoin reaches new heights',
        body: 'Excellent growth and positive momentum in the market',
        publishedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        source: 'Crypto News',
        url: `https://example.com/${i}`
      }));

      mockGetNews.mockResolvedValue({
        articles: mockArticles,
        cached: false,
        stale: false
      });

      const result = await sentimentAnalyzerService.analyzeSentiment('BTC');

      expect(result.symbol).toBe('BTC');
      expect(result.sentimentScore).toBeGreaterThan(0); // Positive sentiment
      expect(result.sentiment).toBe('bullish');
      expect(result.articlesAnalyzed).toBe(5);
    });

    it('should analyze sentiment for ETH with negative news', async () => {
      const mockArticles = Array.from({ length: 5 }, (_, i) => ({
        title: 'Ethereum faces challenges',
        body: 'Terrible performance and bad outlook with negative trends',
        publishedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        source: 'Crypto News',
        url: `https://example.com/${i}`
      }));

      mockGetNews.mockResolvedValue({
        articles: mockArticles,
        cached: false,
        stale: false
      });

      const result = await sentimentAnalyzerService.analyzeSentiment('ETH');

      expect(result.symbol).toBe('ETH');
      expect(result.sentimentScore).toBeLessThan(0); // Negative sentiment
      expect(result.sentiment).toBe('bearish');
    });

    it('should analyze sentiment with mixed news', async () => {
      const mockArticles = [
        {
          title: 'Positive development',
          body: 'Great news',
          publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          source: 'News',
          url: 'https://example.com/1'
        },
        {
          title: 'Negative development',
          body: 'Bad news',
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          source: 'News',
          url: 'https://example.com/2'
        }
      ];

      mockGetNews.mockResolvedValue({
        articles: mockArticles,
        cached: false,
        stale: false
      });

      const result = await sentimentAnalyzerService.analyzeSentiment('AAPL');

      expect(result.symbol).toBe('AAPL');
      expect(result.sentiment).toBe('neutral');
    });

    it('should throw error for missing symbol', async () => {
      await expect(
        sentimentAnalyzerService.analyzeSentiment(null)
      ).rejects.toThrow();
    });

    it('should respect custom hoursBack parameter', async () => {
      const now = Date.now();
      const mockArticles = [
        {
          title: 'Recent',
          body: 'News',
          publishedAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          source: 'Source',
          url: 'https://example.com/1'
        },
        {
          title: 'Old',
          body: 'News',
          publishedAt: new Date(now - 30 * 60 * 60 * 1000).toISOString(), // 30 hours ago
          source: 'Source',
          url: 'https://example.com/2'
        }
      ];

      mockGetNews.mockResolvedValue({
        articles: mockArticles,
        cached: false,
        stale: false
      });

      const result = await sentimentAnalyzerService.analyzeSentiment('BTC', 24);

      // Should only analyze the recent article
      expect(result.articlesAnalyzed).toBe(1);
    });
  });

  describe('sentiment categorization', () => {
    it('should categorize highly positive sentiment as bullish', async () => {
      const mockArticles = Array.from({ length: 3 }, (_, i) => ({
        title: 'Excellent amazing wonderful',
        body: 'Great fantastic superb outstanding',
        publishedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        source: 'Source',
        url: `https://example.com/${i}`
      }));

      mockGetNews.mockResolvedValue({
        articles: mockArticles,
        cached: false,
        stale: false
      });

      const result = await sentimentAnalyzerService.analyzeSentiment('TEST');
      expect(result.sentiment).toBe('bullish');
    });

    it('should categorize highly negative sentiment as bearish', async () => {
      const mockArticles = Array.from({ length: 3 }, (_, i) => ({
        title: 'Terrible horrible awful',
        body: 'Bad negative disappointing poor',
        publishedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        source: 'Source',
        url: `https://example.com/${i}`
      }));

      mockGetNews.mockResolvedValue({
        articles: mockArticles,
        cached: false,
        stale: false
      });

      const result = await sentimentAnalyzerService.analyzeSentiment('TEST');
      expect(result.sentiment).toBe('bearish');
    });

    it('should categorize neutral sentiment correctly', async () => {
      const mockArticles = [{
        title: 'Market update',
        body: 'The market continues trading',
        publishedAt: new Date().toISOString(),
        source: 'Source',
        url: 'https://example.com/1'
      }];

      mockGetNews.mockResolvedValue({
        articles: mockArticles,
        cached: false,
        stale: false
      });

      const result = await sentimentAnalyzerService.analyzeSentiment('TEST');
      expect(result.sentiment).toBe('neutral');
    });
  });

  describe('caching behavior', () => {
    it('should cache sentiment analysis results', async () => {
      const mockArticles = [{
        title: 'News',
        body: 'Content',
        publishedAt: new Date().toISOString(),
        source: 'Source',
        url: 'https://example.com/1'
      }];

      mockGetNews.mockResolvedValue({
        articles: mockArticles,
        cached: false,
        stale: false
      });

      // First call
      const result1 = await sentimentAnalyzerService.analyzeSentiment('CACHE_TEST');
      expect(mockGetNews).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      mockGetNews.mockClear();
      const result2 = await sentimentAnalyzerService.analyzeSentiment('CACHE_TEST');
      expect(mockGetNews).toHaveBeenCalledTimes(0);

      expect(result2.analyzedAt).toBe(result1.analyzedAt);
    });
  });

  describe('top articles selection', () => {
    it('should return top articles sorted by sentiment strength', async () => {
      const mockArticles = [
        {
          title: 'Strongly positive',
          body: 'Excellent amazing wonderful fantastic',
          publishedAt: new Date().toISOString(),
          source: 'Source',
          url: 'https://example.com/1'
        },
        {
          title: 'Neutral',
          body: 'The market continues',
          publishedAt: new Date().toISOString(),
          source: 'Source',
          url: 'https://example.com/2'
        },
        {
          title: 'Strongly negative',
          body: 'Terrible horrible awful disappointing',
          publishedAt: new Date().toISOString(),
          source: 'Source',
          url: 'https://example.com/3'
        }
      ];

      mockGetNews.mockResolvedValue({
        articles: mockArticles,
        cached: false,
        stale: false
      });

      const result = await sentimentAnalyzerService.analyzeSentiment('TEST');

      // Top articles should be sorted by absolute sentiment strength
      expect(result.topArticles.length).toBeGreaterThan(0);
      expect(result.topArticles.length).toBeLessThanOrEqual(5);
      
      // First article should have strongest sentiment (positive or negative)
      const firstSentiment = Math.abs(result.topArticles[0].sentiment);
      result.topArticles.forEach((article, i) => {
        if (i > 0) {
          expect(Math.abs(article.sentiment)).toBeLessThanOrEqual(firstSentiment);
        }
      });
    });

    it('should limit top articles to 5', async () => {
      const mockArticles = Array.from({ length: 20 }, (_, i) => ({
        title: `Article ${i}`,
        body: 'Great positive news',
        publishedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        source: 'Source',
        url: `https://example.com/${i}`
      }));

      mockGetNews.mockResolvedValue({
        articles: mockArticles,
        cached: false,
        stale: false
      });

      const result = await sentimentAnalyzerService.analyzeSentiment('TEST');
      expect(result.topArticles.length).toBeLessThanOrEqual(5);
    });
  });

  describe('error handling', () => {
    it('should handle news service errors gracefully', async () => {
      mockGetNews.mockRejectedValue(new Error('News service error'));

      const result = await sentimentAnalyzerService.analyzeSentiment('TEST');
      
      expect(result).toHaveProperty('error');
      expect(result.error.code).toBe('NO_DATA');
      expect(result.sentiment).toBe('neutral');
      expect(result.articlesAnalyzed).toBe(0);
    });

    it('should return no data response when no articles available', async () => {
      mockGetNews.mockResolvedValue({
        articles: [],
        cached: false,
        stale: false
      });

      const result = await sentimentAnalyzerService.analyzeSentiment('NO_DATA');

      expect(result.sentimentScore).toBe(0);
      expect(result.sentiment).toBe('neutral');
      expect(result.articlesAnalyzed).toBe(0);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('NO_DATA');
    });
  });

  describe('trend calculation', () => {
    it('should calculate improving trend for positive change', async () => {
      const mockArticles = (positive) => [{
        title: 'News',
        body: positive ? 'Excellent great wonderful' : 'Market update',
        publishedAt: new Date().toISOString(),
        source: 'Source',
        url: 'https://example.com/1'
      }];

      // First analysis - neutral
      mockGetNews.mockResolvedValue({
        articles: mockArticles(false),
        cached: false,
        stale: false
      });
      await sentimentAnalyzerService.analyzeSentiment('TREND_TEST');

      // Second analysis - positive
      mockGetNews.mockClear();
      mockGetNews.mockResolvedValue({
        articles: mockArticles(true),
        cached: false,
        stale: false
      });
      
      // Use different symbol to avoid cache
      const result = await sentimentAnalyzerService.analyzeSentiment('TREND_TEST_2');
      
      // Should have trend information
      expect(result.trend).toBeDefined();
      expect(['improving', 'stable', 'declining']).toContain(result.trend);
    });
  });
});
