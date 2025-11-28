/**
 * News Service
 * Handles news fetching and filtering
 */

export class NewsService {
  constructor() {
    // Mock news data - will be replaced with real API in Step 9
    this.newsArticles = [
      {
        id: 1,
        title: 'Bitcoin Surges Past $67,000 as Institutional Interest Grows',
        description: 'Major financial institutions continue to increase their cryptocurrency holdings, driving Bitcoin to new monthly highs.',
        source: 'CryptoNews',
        category: 'crypto',
        symbols: ['BTC'],
        publishedAt: new Date('2024-11-24T10:00:00Z'),
        url: 'https://example.com/news/1',
        image: 'https://via.placeholder.com/400x200/1e1e2e/3b82f6?text=Bitcoin+News',
        sentiment: 'positive'
      },
      {
        id: 2,
        title: 'Ethereum 2.0 Upgrade Shows Promising Results',
        description: 'Network efficiency improves by 40% following the latest protocol upgrade, reducing gas fees significantly.',
        source: 'BlockchainDaily',
        category: 'crypto',
        symbols: ['ETH'],
        publishedAt: new Date('2024-11-24T09:30:00Z'),
        url: 'https://example.com/news/2',
        image: 'https://via.placeholder.com/400x200/1e1e2e/10b981?text=Ethereum+News',
        sentiment: 'positive'
      },
      {
        id: 3,
        title: 'Apple Announces Record Q4 Earnings',
        description: 'Tech giant reports $90 billion in revenue, beating analyst expectations by 8%.',
        source: 'MarketWatch',
        category: 'stocks',
        symbols: ['AAPL'],
        publishedAt: new Date('2024-11-24T08:00:00Z'),
        url: 'https://example.com/news/3',
        image: 'https://via.placeholder.com/400x200/1e1e2e/3b82f6?text=Apple+Earnings',
        sentiment: 'positive'
      },
      {
        id: 4,
        title: 'Federal Reserve Signals Potential Rate Cut',
        description: 'Fed officials hint at monetary policy shift in upcoming meeting, markets react positively.',
        source: 'Financial Times',
        category: 'economy',
        symbols: [],
        publishedAt: new Date('2024-11-24T07:00:00Z'),
        url: 'https://example.com/news/4',
        image: 'https://via.placeholder.com/400x200/1e1e2e/fbbf24?text=Fed+News',
        sentiment: 'neutral'
      },
      {
        id: 5,
        title: 'Tesla Stock Drops 5% on Production Concerns',
        description: 'Manufacturing delays at Gigafactory raise questions about Q4 delivery targets.',
        source: 'Bloomberg',
        category: 'stocks',
        symbols: ['TSLA'],
        publishedAt: new Date('2024-11-23T16:00:00Z'),
        url: 'https://example.com/news/5',
        image: 'https://via.placeholder.com/400x200/1e1e2e/ef4444?text=Tesla+News',
        sentiment: 'negative'
      },
      {
        id: 6,
        title: 'Gold Prices Reach 6-Month High',
        description: 'Safe-haven demand pushes gold above $2,050 per ounce amid global uncertainty.',
        source: 'Commodities Today',
        category: 'commodities',
        symbols: ['XAU'],
        publishedAt: new Date('2024-11-23T14:00:00Z'),
        url: 'https://example.com/news/6',
        image: 'https://via.placeholder.com/400x200/1e1e2e/fbbf24?text=Gold+News',
        sentiment: 'positive'
      },
      {
        id: 7,
        title: 'Solana Network Experiences Brief Outage',
        description: 'Blockchain resumes normal operations after 2-hour downtime, team investigates cause.',
        source: 'CryptoInsider',
        category: 'crypto',
        symbols: ['SOL'],
        publishedAt: new Date('2024-11-23T12:00:00Z'),
        url: 'https://example.com/news/7',
        image: 'https://via.placeholder.com/400x200/1e1e2e/ef4444?text=Solana+News',
        sentiment: 'negative'
      },
      {
        id: 8,
        title: 'EUR/USD Reaches Parity Amid Economic Data',
        description: 'Euro strengthens against dollar following positive European economic indicators.',
        source: 'ForexLive',
        category: 'forex',
        symbols: ['EURUSD'],
        publishedAt: new Date('2024-11-23T10:00:00Z'),
        url: 'https://example.com/news/8',
        image: 'https://via.placeholder.com/400x200/1e1e2e/3b82f6?text=Forex+News',
        sentiment: 'neutral'
      }
    ]
  }

  /**
   * Get all news with optional filters
   */
  async getNews(filters = {}) {
    let filtered = [...this.newsArticles]

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(article => article.category === filters.category)
    }

    // Filter by symbols (for personalized news)
    if (filters.symbols && filters.symbols.length > 0) {
      filtered = filtered.filter(article => 
        article.symbols.some(symbol => filters.symbols.includes(symbol))
      )
    }

    // Filter by sentiment
    if (filters.sentiment && filters.sentiment !== 'all') {
      filtered = filtered.filter(article => article.sentiment === filters.sentiment)
    }

    // Search by title or description
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.description.toLowerCase().includes(searchLower)
      )
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

    return filtered
  }

  /**
   * Get breaking news (last 24 hours)
   */
  async getBreakingNews() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return this.newsArticles
      .filter(article => new Date(article.publishedAt) > oneDayAgo)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 5)
  }

  /**
   * Get personalized news based on user's holdings
   */
  async getPersonalizedNews(userSymbols = []) {
    if (userSymbols.length === 0) {
      return []
    }

    return this.newsArticles
      .filter(article => 
        article.symbols.some(symbol => userSymbols.includes(symbol))
      )
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 10)
  }

  /**
   * Get news by category
   */
  async getNewsByCategory(category) {
    return this.newsArticles
      .filter(article => article.category === category)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  }

  /**
   * Get market sentiment summary
   */
  async getMarketSentiment() {
    const recentNews = this.newsArticles.slice(0, 20)
    
    const sentimentCounts = {
      positive: 0,
      neutral: 0,
      negative: 0
    }

    recentNews.forEach(article => {
      sentimentCounts[article.sentiment]++
    })

    const total = recentNews.length
    const sentimentScore = (
      (sentimentCounts.positive * 1) + 
      (sentimentCounts.neutral * 0) + 
      (sentimentCounts.negative * -1)
    ) / total

    return {
      score: sentimentScore,
      positive: sentimentCounts.positive,
      neutral: sentimentCounts.neutral,
      negative: sentimentCounts.negative,
      total,
      sentiment: sentimentScore > 0.2 ? 'bullish' : sentimentScore < -0.2 ? 'bearish' : 'neutral'
    }
  }
}

export default new NewsService()
