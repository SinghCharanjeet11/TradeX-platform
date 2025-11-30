# Design Document

## Overview

The News Feed Enhancement transforms the TradeX news system from a static mock implementation into a dynamic, real-time news aggregation platform. The system integrates with external news APIs (CryptoCompare News API as primary source), implements intelligent caching, provides personalized content filtering, and delivers a rich user experience through search, sentiment analysis, and bookmarking capabilities.

The architecture follows a provider pattern similar to the existing market data system, ensuring consistency and maintainability. The design emphasizes performance through aggressive caching, graceful degradation during API failures, and optimistic UI updates.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  NewsPage    │  │ ArticleModal │  │ SearchBar    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  newsService   │                        │
│                    └───────┬────────┘                        │
└────────────────────────────┼──────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────┼──────────────────────────────────┐
│                    ┌───────▼────────┐                         │
│                    │ newsController │                         │
│                    └───────┬────────┘                         │
│                            │                                  │
│                    ┌───────▼────────┐                         │
│                    │  newsService   │                         │
│                    └───┬────────┬───┘                         │
│                        │        │                             │
│              ┌─────────┘        └─────────┐                   │
│              │                            │                   │
│      ┌───────▼────────┐          ┌────────▼────────┐         │
│      │ newsProvider   │          │  cacheService   │         │
│      └───────┬────────┘          └─────────────────┘         │
│              │                                                │
│      ┌───────▼────────┐                                       │
│      │ newsRepository │                                       │
│      └───────┬────────┘                                       │
│              │                                                │
│      ┌───────▼────────┐                                       │
│      │   Database     │                                       │
│      └────────────────┘                                       │
│                        Server Layer                           │
└───────────────────────────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  External APIs  │
                    │  (CryptoCompare)│
                    └─────────────────┘
```

### Component Responsibilities

- **NewsPage**: Main UI component, manages filters, search, and article display
- **ArticleModal**: Full-screen article reader with external link support
- **SearchBar**: Debounced search input with real-time filtering
- **newsService (Client)**: API client for news endpoints
- **newsController**: HTTP request handler, validates inputs
- **newsService (Server)**: Business logic, orchestrates providers and cache
- **newsProvider**: External API integration (CryptoCompare News API)
- **cacheService**: Redis-based caching with TTL management
- **newsRepository**: Database operations for bookmarks and user preferences

## Components and Interfaces

### 1. News Provider (server/providers/newsProvider.js)

```javascript
class NewsProvider {
  /**
   * Fetch latest news articles from CryptoCompare
   * @param {Object} options - Filter options
   * @param {string[]} options.categories - News categories
   * @param {string[]} options.symbols - Asset symbols to filter
   * @param {number} options.limit - Max articles to return
   * @returns {Promise<Article[]>}
   */
  async getNews(options)

  /**
   * Fetch breaking news (high priority articles)
   * @returns {Promise<Article[]>}
   */
  async getBreakingNews()

  /**
   * Fetch news for specific symbols
   * @param {string[]} symbols - Asset symbols
   * @returns {Promise<Article[]>}
   */
  async getNewsBySymbols(symbols)

  /**
   * Transform external API response to internal format
   * @param {Object} externalArticle - Raw API response
   * @returns {Article}
   */
  transformArticle(externalArticle)
}
```

### 2. News Service (server/services/newsService.js)

```javascript
class NewsService {
  /**
   * Get news with caching and filtering
   * @param {Object} filters - Filter criteria
   * @param {string} filters.category - Category filter
   * @param {string} filters.sentiment - Sentiment filter
   * @param {string} filters.search - Search query
   * @param {string[]} filters.symbols - Symbol filter
   * @returns {Promise<Article[]>}
   */
  async getNews(filters)

  /**
   * Get personalized news based on user holdings
   * @param {number} userId - User ID
   * @returns {Promise<Article[]>}
   */
  async getPersonalizedNews(userId)

  /**
   * Get breaking news with cache
   * @returns {Promise<Article[]>}
   */
  async getBreakingNews()

  /**
   * Calculate sentiment score for article
   * @param {string} content - Article content
   * @returns {number} Score between -1 and 1
   */
  calculateSentiment(content)

  /**
   * Filter articles by search query
   * @param {Article[]} articles - Articles to filter
   * @param {string} query - Search query
   * @returns {Article[]}
   */
  filterBySearch(articles, query)
}
```

### 3. News Repository (server/repositories/newsRepository.js)

```javascript
class NewsRepository {
  /**
   * Save bookmark for user
   * @param {number} userId - User ID
   * @param {string} articleId - Article ID
   * @returns {Promise<void>}
   */
  async addBookmark(userId, articleId)

  /**
   * Remove bookmark
   * @param {number} userId - User ID
   * @param {string} articleId - Article ID
   * @returns {Promise<void>}
   */
  async removeBookmark(userId, articleId)

  /**
   * Get user's bookmarked articles
   * @param {number} userId - User ID
   * @returns {Promise<string[]>} Article IDs
   */
  async getBookmarks(userId)

  /**
   * Check if article is bookmarked
   * @param {number} userId - User ID
   * @param {string} articleId - Article ID
   * @returns {Promise<boolean>}
   */
  async isBookmarked(userId, articleId)
}
```

### 4. Client News Service (client/src/services/newsService.js)

```javascript
const newsService = {
  /**
   * Fetch news with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<{success: boolean, data: Article[]}>}
   */
  async getNews(filters)

  /**
   * Fetch personalized news
   * @returns {Promise<{success: boolean, data: Article[]}>}
   */
  async getPersonalizedNews()

  /**
   * Fetch breaking news
   * @returns {Promise<{success: boolean, data: Article[]}>}
   */
  async getBreakingNews()

  /**
   * Toggle bookmark status
   * @param {string} articleId - Article ID
   * @returns {Promise<{success: boolean}>}
   */
  async toggleBookmark(articleId)

  /**
   * Get bookmarked articles
   * @returns {Promise<{success: boolean, data: Article[]}>}
   */
  async getBookmarks()
}
```

## Data Models

### Article Model

```typescript
interface Article {
  id: string                    // Unique identifier
  title: string                 // Article headline
  body: string                  // Full article content
  excerpt: string               // Short summary (150 chars)
  source: string                // News source name
  sourceUrl: string             // Original article URL
  imageUrl?: string             // Article image
  publishedAt: Date             // Publication timestamp
  category: string              // News, Analysis, Guide, etc.
  tags: string[]                // Related topics/keywords
  symbols: string[]             // Mentioned asset symbols
  sentiment: number             // -1 to 1 (negative to positive)
  isBreaking: boolean           // Breaking news flag
  priority: number              // Display priority (1-10)
}
```

### Bookmark Model

```typescript
interface Bookmark {
  id: number                    // Auto-increment ID
  userId: number                // User who bookmarked
  articleId: string             // Article identifier
  createdAt: Date               // Bookmark timestamp
}
```

### News Filter Model

```typescript
interface NewsFilters {
  category?: string             // Category filter
  sentiment?: 'positive' | 'negative' | 'neutral'
  search?: string               // Search query
  symbols?: string[]            // Asset symbols
  dateFrom?: Date               // Start date
  dateTo?: Date                 // End date
  limit?: number                // Max results
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all testable properties from the prework, several can be consolidated:

- Properties 8.2, 8.3, 8.4 (sentiment thresholds) can be combined into one comprehensive sentiment classification property
- Properties 3.1 and 3.2 (holdings and watchlist news) can be combined into one asset-based news fetching property
- Properties 7.2 and 7.3 (cache TTL behavior) can be combined into one cache freshness property
- Properties 9.1 and 9.3 (add/remove bookmark) can be combined into one bookmark toggle property

### Correctness Properties

**Property 1: Article transformation preserves required fields**
*For any* external article from a News Provider, the transformed article must contain valid values for id, title, body, excerpt, source, sourceUrl, publishedAt, and category fields.
**Validates: Requirements 1.2**

**Property 2: Article display contains required information**
*For any* article rendered in the news feed, the displayed HTML must contain the article's title, excerpt, source, timestamp, and category.
**Validates: Requirements 1.3**

**Property 3: Provider failure triggers cache fallback**
*For any* News Provider request that fails, the system must return cached articles and set an error state flag.
**Validates: Requirements 1.4**

**Property 4: Search filters by query match**
*For any* search query and article collection, all returned articles must contain the query string (case-insensitive) in either the title or body field.
**Validates: Requirements 2.1**

**Property 5: Multi-word search uses OR logic**
*For any* search query containing multiple words, returned articles must match at least one of the words in title or body.
**Validates: Requirements 2.2**

**Property 6: Search debouncing delays execution**
*For any* sequence of search inputs within 300ms, only the final input should trigger a search request.
**Validates: Requirements 2.5**

**Property 7: Personalized feed includes user asset news**
*For any* user with holdings or watchlist symbols, the personalized feed must include articles where the symbols array intersects with the user's assets.
**Validates: Requirements 3.1, 3.2**

**Property 8: Personalized feed prioritizes user assets**
*For any* personalized feed, articles matching user assets must appear before articles that don't match user assets.
**Validates: Requirements 3.3**

**Property 9: Article mentions display matched symbols**
*For any* article that mentions multiple user assets, the displayed article must show all matched symbol names.
**Validates: Requirements 3.5**

**Property 10: Modal displays complete article data**
*For any* article opened in the modal, the rendered modal must contain title, full body text, source, timestamp, and external link URL.
**Validates: Requirements 4.2**

**Property 11: Modal open prevents background scroll**
*For any* state where the article modal is open, the document body must have overflow style set to hidden.
**Validates: Requirements 4.5**

**Property 12: Category filter returns only matching articles**
*For any* selected category and article collection, all returned articles must have a category field equal to the selected category.
**Validates: Requirements 5.1**

**Property 13: Sentiment filter returns matching articles**
*For any* selected sentiment filter (positive/negative/neutral), all returned articles must have sentiment scores within the corresponding range.
**Validates: Requirements 5.2**

**Property 14: Multiple filters use AND logic**
*For any* combination of active filters (category, sentiment, search), returned articles must satisfy all filter conditions simultaneously.
**Validates: Requirements 5.3**

**Property 15: Breaking news appears in dedicated section**
*For any* article with isBreaking flag set to true and age less than 2 hours, the article must appear in the breaking news section.
**Validates: Requirements 6.1**

**Property 16: Stale breaking news moves to regular feed**
*For any* article with isBreaking flag and age greater than 2 hours, the article must not appear in the breaking news section.
**Validates: Requirements 6.2**

**Property 17: Breaking news sorted by recency**
*For any* collection of breaking news articles, the display order must be sorted by publishedAt timestamp in descending order (newest first).
**Validates: Requirements 6.3**

**Property 18: Urgent keywords trigger badge**
*For any* article containing urgent keywords (breaking, urgent, alert, critical) in title or body, the rendered article must include a visual badge indicator.
**Validates: Requirements 6.4**

**Property 19: Dismissed breaking news persists in session**
*For any* breaking news article dismissed by a user, that article must not reappear in the breaking section during the same session.
**Validates: Requirements 6.5**

**Property 20: Successful fetch stores in cache**
*For any* successful News Provider response, the cache must contain an entry with that data and a TTL of 5 minutes.
**Validates: Requirements 7.1**

**Property 21: Cache serves fresh data within TTL**
*For any* cache entry with age less than 5 minutes, the system must return cached data without making an external API call.
**Validates: Requirements 7.2, 7.3**

**Property 22: Provider failure serves stale cache**
*For any* News Provider failure, if cache contains data less than 1 hour old, the system must return that stale cached data.
**Validates: Requirements 7.4**

**Property 23: Cache eviction removes oldest entries**
*For any* cache state exceeding 100MB, the eviction process must remove entries in order of oldest timestamp first.
**Validates: Requirements 7.5**

**Property 24: Sentiment score determines indicator type**
*For any* article with a sentiment score, the displayed indicator must be positive (score > 0.3), negative (score < -0.3), or neutral (-0.3 ≤ score ≤ 0.3).
**Validates: Requirements 8.2, 8.3, 8.4**

**Property 25: Bookmark toggle updates state**
*For any* bookmark action (add or remove), the article's bookmarked state must change to the opposite value and persist in the database.
**Validates: Requirements 9.1, 9.3**

**Property 26: Bookmarked articles show indicator**
*For any* article that exists in the user's bookmarks, the rendered article must display a bookmarked indicator icon.
**Validates: Requirements 9.5**

**Property 27: Bookmark persistence across sessions**
*For any* article bookmarked by a user, that bookmark must still exist after the user logs out and logs back in.
**Validates: Requirements 9.4**

**Property 28: Timeout triggers retry after delay**
*For any* News Provider request that times out, the system must schedule a retry attempt exactly 30 seconds after the timeout.
**Validates: Requirements 10.1**

**Property 29: Invalid data skipped and logged**
*For any* article data that fails validation, that article must not appear in results and an error must be logged.
**Validates: Requirements 10.2**

**Property 30: Persistent errors show user guidance**
*For any* error state lasting longer than 5 minutes, the system must display a user notification with actionable guidance.
**Validates: Requirements 10.5**

## Error Handling

### Error Categories

1. **Network Errors**
   - Timeout: Retry after 30s, serve stale cache
   - Connection refused: Serve stale cache, show offline indicator
   - DNS failure: Serve stale cache, show offline indicator

2. **API Errors**
   - 429 Rate Limit: Exponential backoff, serve cache
   - 401 Unauthorized: Log error, notify admin, serve cache
   - 500 Server Error: Retry with backoff, serve cache
   - Invalid response: Skip article, log error, continue

3. **Data Errors**
   - Missing required fields: Skip article, log warning
   - Invalid date format: Use current time, log warning
   - Malformed content: Sanitize and display, log warning

4. **Cache Errors**
   - Cache miss: Fetch from provider
   - Cache full: Evict oldest entries
   - Cache corruption: Clear cache, fetch fresh

### Error Recovery Strategy

```javascript
async function fetchWithFallback(fetchFn, cacheKey) {
  try {
    const data = await fetchFn()
    await cache.set(cacheKey, data, TTL_5_MIN)
    return { data, source: 'live' }
  } catch (error) {
    const cached = await cache.get(cacheKey)
    if (cached && cached.age < TTL_1_HOUR) {
      return { data: cached.data, source: 'cache', stale: true }
    }
    throw error
  }
}
```

## Testing Strategy

### Unit Testing

Unit tests will cover:
- Article transformation logic (external format → internal format)
- Search filtering with various query patterns
- Sentiment calculation algorithm
- Cache TTL and eviction logic
- Filter combination logic (AND operations)
- Bookmark state management

### Property-Based Testing

We will use **fast-check** (JavaScript property-based testing library) to implement the 30 correctness properties defined above. Each property test will:
- Run a minimum of 100 iterations with randomly generated inputs
- Be tagged with the format: `**Feature: news-feed-enhancement, Property X: [property description]**`
- Test universal behaviors across all valid inputs

Example property test structure:
```javascript
// **Feature: news-feed-enhancement, Property 1: Article transformation preserves required fields**
fc.assert(
  fc.property(
    fc.record({
      id: fc.string(),
      title: fc.string(),
      body: fc.string(),
      // ... other fields
    }),
    (externalArticle) => {
      const transformed = newsProvider.transformArticle(externalArticle)
      return (
        transformed.id !== undefined &&
        transformed.title !== undefined &&
        transformed.body !== undefined &&
        // ... check all required fields
      )
    }
  ),
  { numRuns: 100 }
)
```

### Integration Testing

Integration tests will verify:
- End-to-end news fetching from external API
- Cache integration with Redis
- Database bookmark operations
- API endpoint responses with authentication

### Performance Testing

- Cache hit rate should exceed 80% under normal load
- API response time should be under 200ms (cached) and 2s (live)
- Search filtering should complete in under 50ms for 1000 articles
- Modal open/close should complete in under 100ms

## API Endpoints

### GET /api/news
Fetch news articles with optional filters

**Query Parameters:**
- `category` (string, optional): Filter by category
- `sentiment` (string, optional): positive, negative, neutral
- `search` (string, optional): Search query
- `symbols` (string, optional): Comma-separated asset symbols
- `limit` (number, optional): Max results (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "title": "Bitcoin Reaches New High",
      "excerpt": "Bitcoin surpasses $50,000...",
      "body": "Full article content...",
      "source": "CryptoNews",
      "sourceUrl": "https://...",
      "imageUrl": "https://...",
      "publishedAt": "2024-01-15T10:30:00Z",
      "category": "News",
      "tags": ["bitcoin", "price"],
      "symbols": ["BTC"],
      "sentiment": 0.75,
      "isBreaking": false,
      "priority": 5
    }
  ],
  "count": 25,
  "cached": false
}
```

### GET /api/news/personalized
Fetch personalized news based on user's portfolio

**Response:** Same as /api/news

### GET /api/news/breaking
Fetch breaking news only

**Response:** Same as /api/news

### POST /api/news/bookmarks
Toggle bookmark for an article

**Request Body:**
```json
{
  "articleId": "abc123"
}
```

**Response:**
```json
{
  "success": true,
  "bookmarked": true
}
```

### GET /api/news/bookmarks
Get user's bookmarked articles

**Response:** Same as /api/news

## External API Integration

### CryptoCompare News API

**Endpoint:** `https://min-api.cryptocompare.com/data/v2/news/`

**Authentication:** API key in query parameter

**Rate Limits:** 
- Free tier: 100 requests/day
- Paid tier: 100,000 requests/month

**Caching Strategy:**
- Cache all responses for 5 minutes
- Serve stale cache (up to 1 hour) on API failure
- Implement request deduplication for concurrent requests

**Response Transformation:**
```javascript
{
  // External format
  id: "123",
  title: "...",
  body: "...",
  source: "...",
  url: "...",
  imageurl: "...",
  published_on: 1234567890,
  categories: "BTC|ETH",
  // Transform to internal format
  id: "123",
  title: "...",
  body: "...",
  excerpt: body.substring(0, 150),
  source: "...",
  sourceUrl: url,
  imageUrl: imageurl,
  publishedAt: new Date(published_on * 1000),
  category: "News",
  tags: [],
  symbols: categories.split("|"),
  sentiment: calculateSentiment(body),
  isBreaking: false,
  priority: 5
}
```

## Database Schema

### bookmarks table

```sql
CREATE TABLE bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, article_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_article_id ON bookmarks(article_id);
```

## Security Considerations

1. **API Key Protection**: Store CryptoCompare API key in environment variables
2. **Rate Limiting**: Implement per-user rate limits on bookmark operations
3. **Input Sanitization**: Sanitize search queries to prevent injection attacks
4. **XSS Prevention**: Sanitize article content before rendering in modal
5. **CORS**: Restrict API access to authorized domains only

## Performance Optimizations

1. **Aggressive Caching**: 5-minute cache TTL reduces API calls by ~95%
2. **Request Deduplication**: Prevent duplicate concurrent requests
3. **Lazy Loading**: Load article images only when visible in viewport
4. **Search Debouncing**: 300ms debounce reduces unnecessary searches
5. **Virtual Scrolling**: Render only visible articles in long lists
6. **Memoization**: Cache filtered/sorted results in React components

## Deployment Considerations

1. **Environment Variables**:
   - `CRYPTOCOMPARE_API_KEY`: CryptoCompare API key
   - `NEWS_CACHE_TTL`: Cache TTL in seconds (default: 300)
   - `NEWS_STALE_CACHE_TTL`: Stale cache TTL in seconds (default: 3600)

2. **Redis Configuration**:
   - Allocate 100MB for news cache
   - Enable LRU eviction policy
   - Set maxmemory-policy to allkeys-lru

3. **Monitoring**:
   - Track API response times
   - Monitor cache hit rates
   - Alert on API failures exceeding 5 minutes
   - Log all external API errors

4. **Rollback Plan**:
   - Keep mock data as fallback
   - Feature flag to disable external API integration
   - Graceful degradation to cached data only
