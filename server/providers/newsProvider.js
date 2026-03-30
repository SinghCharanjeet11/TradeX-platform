import axios from 'axios';
import { apiConfig } from '../config/apiConfig.js';

const COINGECKO_URL = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const NEWSAPI_URL = 'https://newsapi.org/v2';

/**
 * Generate sample crypto news from trending coins
 */
async function generateTrendingNews(limit = 50) {
  try {
    const response = await axios.get(`${COINGECKO_URL}/search/trending`, {
      timeout: 10000
    });

    if (response.data && response.data.coins) {
      return response.data.coins.slice(0, limit).map((coin, index) => ({
        id: `trending-${coin.item.id}-${index}`,
        title: `${coin.item.name} (${coin.item.symbol.toUpperCase()}) is trending in the market`,
        body: `${coin.item.name} has gained significant interest. Current data: Market cap rank #${coin.item.market_cap_rank}`,
        url: `https://www.coingecko.com/en/coins/${coin.item.id}`,
        imageUrl: coin.item.large || null,
        publishedAt: new Date().toISOString(),
        source: 'CoinGecko Trending',
        categories: ['cryptocurrency', 'trending'],
        tags: [coin.item.symbol.toUpperCase(), 'trending']
      }));
    }
    return [];
  } catch (error) {
    console.warn('[NewsProvider] Failed to generate trending news:', error.message);
    return [];
  }
}

/**
 * Fetch latest cryptocurrency news from NewsAPI (primary) or CoinGecko trending fallback
 */
export async function fetchCryptoNews({ categories = [], excludeCategories = [], limit = 50 } = {}) {
  try {
    // Try NewsAPI first if key is available
    if (NEWSAPI_KEY && NEWSAPI_KEY !== 'your_newsapi_key_here') {
      try {
        console.log('[NewsProvider] Trying NewsAPI...');
        const response = await axios.get(`${NEWSAPI_URL}/everything`, {
          params: {
            q: 'cryptocurrency OR bitcoin OR ethereum OR crypto',
            sortBy: 'publishedAt',
            language: 'en',
            apiKey: NEWSAPI_KEY,
            pageSize: limit || 50
          },
          timeout: 10000
        });

        if (response.data && response.data.articles) {
          console.log('[NewsProvider] NewsAPI success, returning articles');
          return response.data.articles.map(article => ({
            id: article.url,
            title: article.title,
            body: article.description || article.content || '',
            url: article.url,
            imageUrl: article.urlToImage,
            publishedAt: article.publishedAt,
            source: article.source?.name || 'NewsAPI',
            categories: categories.length > 0 ? categories : ['cryptocurrency'],
            tags: []
          }));
        }
      } catch (newsApiError) {
        console.warn('[NewsProvider] NewsAPI failed:', newsApiError.message);
      }
    }

    // Fallback to CoinGecko trending data
    console.log('[NewsProvider] Falling back to CoinGecko trending...');
    const trendingNews = await generateTrendingNews(limit);

    if (trendingNews.length > 0) {
      console.log('[NewsProvider] Returning trending news:', trendingNews.length, 'articles');
      return trendingNews;
    }

    // Last resort - return empty array with no error (shows "no news" instead of error)
    console.warn('[NewsProvider] No news sources available');
    return [];
  } catch (error) {
    console.error('[NewsProvider] Error fetching crypto news:', error.message);
    throw new Error('Failed to fetch cryptocurrency news');
  }
}

/**
 * Search news articles by query
 */
export async function searchNews(query, limit = 20) {
  try {
    // CryptoCompare doesn't have a direct search endpoint, so we fetch recent news
    // and filter on our end
    const articles = await fetchCryptoNews({ limit: 100 });
    
    const searchTerm = query.toLowerCase();
    const filtered = articles.filter(article => 
      article.title.toLowerCase().includes(searchTerm) ||
      article.body.toLowerCase().includes(searchTerm) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );

    return filtered.slice(0, limit);
  } catch (error) {
    console.error('Error searching news:', error.message);
    throw new Error('Failed to search news');
  }
}

/**
 * Get news with filters (main method for news service)
 */
async function getNews({ categories, symbols, limit = 50 } = {}) {
  return fetchCryptoNews({ categories, limit });
}

/**
 * Get breaking news (last 2 hours)
 */
async function getBreakingNews() {
  const articles = await fetchCryptoNews({ limit: 20 });
  const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
  return articles.filter(article => new Date(article.publishedAt).getTime() > twoHoursAgo);
}

/**
 * Get news by symbols
 */
async function getNewsBySymbols(symbols) {
  const articles = await fetchCryptoNews({ limit: 100 });
  // Filter articles that mention any of the symbols
  return articles.filter(article => {
    const content = `${article.title} ${article.body}`.toLowerCase();
    return symbols.some(symbol => content.includes(symbol.toLowerCase()));
  });
}

export default {
  getNews,
  getBreakingNews,
  getNewsBySymbols,
  fetchCryptoNews,
  searchNews
};
