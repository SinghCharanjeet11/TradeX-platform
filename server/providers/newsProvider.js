import axios from 'axios';
import { apiConfig } from '../config/apiConfig.js';

const CRYPTOCOMPARE_API_KEY = process.env.CRYPTOCOMPARE_API_KEY;
const BASE_URL = 'https://min-api.cryptocompare.com/data/v2';

/**
 * Fetch latest cryptocurrency news from CryptoCompare API
 */
export async function fetchCryptoNews({ categories = [], excludeCategories = [], limit = 50 } = {}) {
  try {
    const params = {
      lang: 'EN',
      sortOrder: 'latest'
    };

    if (limit) params.limit = limit;
    if (categories.length > 0) params.categories = categories.join(',');
    if (excludeCategories.length > 0) params.excludeCategories = excludeCategories.join(',');

    const response = await axios.get(`${BASE_URL}/news/`, {
      params,
      headers: CRYPTOCOMPARE_API_KEY ? {
        'authorization': `Apikey ${CRYPTOCOMPARE_API_KEY}`
      } : {},
      timeout: 10000
    });

    if (response.data && response.data.Data) {
      return response.data.Data.map(article => ({
        id: article.id,
        title: article.title,
        body: article.body,
        url: article.url,
        imageUrl: article.imageurl,
        publishedAt: new Date(article.published_on * 1000).toISOString(),
        source: article.source_info?.name || article.source,
        categories: article.categories ? article.categories.split('|') : [],
        tags: article.tags ? article.tags.split('|') : []
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching crypto news:', error.message);
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
