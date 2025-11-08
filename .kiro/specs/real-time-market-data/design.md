# Real-Time Market Data Integration - Design Document

## Overview

This design implements a robust market data integration system that fetches real-time prices from multiple external APIs (CoinGecko for crypto, Alpha Vantage for stocks/forex/commodities) and serves them to the TradeX dashboard. The architecture emphasizes caching, error resilience, and efficient API usage to provide a seamless user experience while respecting API rate limits.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  React Frontend │
│   (Dashboard)   │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Express Server │
│  Market Routes  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Market Service  │
│  (Orchestrator) │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ Crypto │ │ Stocks │
│Provider│ │Provider│
└───┬────┘ └───┬────┘
    │          │
    ▼          ▼
┌─────────┐ ┌──────────────┐
│CoinGecko│ │Alpha Vantage │
│   API   │ │     API      │
└─────────┘ └──────────────┘
```

### Data Flow

1. Frontend requests market data via `/api/markets/:type` endpoint
2. Market controller validates request and calls appropriate service method
3. Service checks cache for fresh data
4. If cache miss or stale, service calls external API provider
5. Provider fetches data, transforms it to standard format
6. Service caches response and returns to controller
7. Controller sends formatted response to frontend
8. Frontend updates UI with real-time data

## Components and Interfaces

### 1. Market Data Providers

**CryptoProvider** (`server/providers/cryptoProvider.js`)
```javascript
class CryptoProvider {
  async getTopCryptocurrencies(limit = 20)
  async getCryptocurrencyById(id)
  async getMarketChart(id, days = 7)
}
```

**StocksProvider** (`server/providers/stocksProvider.js`)
```javascript
class StocksProvider {
  async getStockQuote(symbol)
  async getMultipleStockQuotes(symbols)
  async getStockTimeSeries(symbol, interval = 'daily')
}
```

**ForexProvider** (`server/providers/forexProvider.js`)
```javascript
class ForexProvider {
  async getExchangeRate(fromCurrency, toCurrency)
  async getMultipleExchangeRates(pairs)
  async getForexTimeSeries(pair, interval = '60min')
}
```

**CommoditiesProvider** (`server/providers/commoditiesProvider.js`)
```javascript
class CommoditiesProvider {
  async getCommodityPrice(symbol)
  async getMultipleCommodityPrices(symbols)
  async getCommodityTimeSeries(symbol, interval = 'daily')
}
```

### 2. Market Service

**MarketService** (`server/services/marketService.js`)
```javascript
class MarketService {
  constructor(cache, cryptoProvider, stocksProvider, forexProvider, commoditiesProvider)
  
  async getCryptoMarketData()
  async getStocksMarketData()
  async getForexMarketData()
  async getCommoditiesMarketData()
  async getMarketChartData(marketType, symbol, days)
  
  // Private methods
  _getCachedData(key)
  _setCachedData(key, data, ttl)
  _transformCryptoData(rawData)
  _transformStocksData(rawData)
  _transformForexData(rawData)
  _transformCommoditiesData(rawData)
}
```

### 3. Cache Service

**CacheService** (`server/services/cacheService.js`)
```javascript
class CacheService {
  constructor()
  
  get(key)
  set(key, value, ttlSeconds)
  delete(key)
  clear()
  has(key)
  isStale(key)
}
```

Uses in-memory storage with TTL tracking. Can be extended to Redis for production.

### 4. Market Controller

**MarketController** (`server/controllers/marketController.js`)
```javascript
exports.getMarketData = async (req, res) => {
  // GET /api/markets/:type (crypto|stocks|forex|commodities)
}

exports.getMarketChart = async (req, res) => {
  // GET /api/markets/:type/:symbol/chart?days=7
}

exports.getMarketHealth = async (req, res) => {
  // GET /api/markets/health
}
```

### 5. Market Routes

**MarketRoutes** (`server/routes/marketRoutes.js`)
```javascript
router.get('/markets/:type', authenticate, getMarketData)
router.get('/markets/:type/:symbol/chart', authenticate, getMarketChart)
router.get('/markets/health', getMarketHealth)
```

### 6. Frontend Market Service

**marketService.js** (`client/src/services/marketService.js`)
```javascript
export const marketService = {
  getCryptoData: () => api.get('/markets/crypto'),
  getStocksData: () => api.get('/markets/stocks'),
  getForexData: () => api.get('/markets/forex'),
  getCommoditiesData: () => api.get('/markets/commodities'),
  getChartData: (type, symbol, days) => api.get(`/markets/${type}/${symbol}/chart?days=${days}`)
}
```

### 7. Updated Dashboard Components

**DashboardPage.jsx** - Modified to fetch real data
```javascript
const [marketData, setMarketData] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
const [lastUpdate, setLastUpdate] = useState(null)

useEffect(() => {
  fetchMarketData(activeMarket)
  const interval = setInterval(() => fetchMarketData(activeMarket), 30000)
  return () => clearInterval(interval)
}, [activeMarket])
```

**MarketTable.jsx** - Enhanced with loading states and error handling

## Data Models

### Standardized Market Data Response

```javascript
{
  success: true,
  data: [
    {
      id: string,           // Unique identifier
      symbol: string,       // Trading symbol (BTC, AAPL, EUR/USD)
      name: string,         // Full name
      price: number,        // Current price
      change24h: number,    // 24h change percentage
      volume24h: number,    // 24h trading volume
      marketCap: number,    // Market capitalization (if applicable)
      lastUpdate: string,   // ISO timestamp
      source: string        // Data source (coingecko, alphavantage)
    }
  ],
  metadata: {
    timestamp: string,
    cached: boolean,
    cacheAge: number,      // Seconds since cached
    source: string
  }
}
```

### Chart Data Response

```javascript
{
  success: true,
  data: {
    symbol: string,
    prices: [
      {
        timestamp: string,
        price: number,
        volume: number
      }
    ]
  },
  metadata: {
    interval: string,
    days: number,
    source: string
  }
}
```

## External API Integration

### CoinGecko API (Free Tier)

**Base URL:** `https://api.coingecko.com/api/v3`

**Key Endpoints:**
- `/coins/markets` - Get market data for cryptocurrencies
- `/coins/{id}/market_chart` - Get historical chart data
- `/simple/price` - Get simple price data

**Rate Limits:** 10-50 calls/minute (free tier)

**No API Key Required** - Public API

### Alpha Vantage API (Free Tier)

**Base URL:** `https://www.alphavantage.co/query`

**Key Endpoints:**
- `GLOBAL_QUOTE` - Get stock quote
- `FX_INTRADAY` - Get forex data
- `TIME_SERIES_DAILY` - Get commodity/stock time series

**Rate Limits:** 25 calls/day (free tier), 5 calls/minute

**API Key Required** - Free registration at alphavantage.co

**Alternative for Production:** Consider Twelve Data API (800 calls/day free tier)

### API Configuration

Environment variables in `server/.env`:
```
COINGECKO_API_URL=https://api.coingecko.com/api/v3
ALPHA_VANTAGE_API_KEY=your_api_key_here
ALPHA_VANTAGE_API_URL=https://www.alphavantage.co/query
```

## Caching Strategy

### Cache TTL by Market Type

- **Crypto:** 30 seconds (high volatility)
- **Stocks:** 60 seconds (during market hours)
- **Forex:** 60 seconds (24/5 market)
- **Commodities:** 120 seconds (lower volatility)

### Cache Keys

```
market:crypto:list
market:stocks:list
market:forex:list
market:commodities:list
market:chart:{type}:{symbol}:{days}
```

### Cache Invalidation

- Automatic TTL expiration
- Manual invalidation on error recovery
- Clear all on server restart

## Error Handling

### Error Types and Responses

1. **API Rate Limit Exceeded**
   - Return cached data with `cached: true` flag
   - Display "Using cached data" indicator in UI
   - Log warning for monitoring

2. **API Request Failure**
   - Retry with exponential backoff (3 attempts)
   - Fall back to cached data if available
   - Return error response if no cache

3. **Invalid API Key**
   - Log critical error
   - Return 503 Service Unavailable
   - Display maintenance message in UI

4. **Network Timeout**
   - Set 10-second timeout for API requests
   - Fall back to cached data
   - Log timeout event

### Error Response Format

```javascript
{
  success: false,
  error: {
    code: 'API_ERROR',
    message: 'Unable to fetch market data',
    cached: true,
    cacheAge: 45
  },
  data: [] // Cached data if available
}
```

## Testing Strategy

### Unit Tests

1. **Provider Tests**
   - Mock external API responses
   - Test data transformation logic
   - Test error handling for each provider

2. **Service Tests**
   - Test cache hit/miss scenarios
   - Test TTL expiration
   - Test multi-provider orchestration

3. **Controller Tests**
   - Test route parameter validation
   - Test authentication middleware
   - Test response formatting

### Integration Tests

1. **API Integration Tests**
   - Test actual API calls (with test keys)
   - Verify response format compliance
   - Test rate limit handling

2. **End-to-End Tests**
   - Test complete data flow from API to UI
   - Test real-time updates
   - Test error recovery scenarios

### Manual Testing Checklist

- [ ] Verify crypto data displays correctly
- [ ] Verify stocks data displays correctly
- [ ] Verify forex data displays correctly
- [ ] Verify commodities data displays correctly
- [ ] Test market switching functionality
- [ ] Test auto-refresh (30-second intervals)
- [ ] Test with invalid API key
- [ ] Test with network disconnection
- [ ] Test cache behavior
- [ ] Verify loading states
- [ ] Verify error messages

## Performance Considerations

### Optimization Strategies

1. **Batch API Requests**
   - Fetch multiple symbols in single request when possible
   - Reduce total API call count

2. **Intelligent Caching**
   - Cache popular symbols longer
   - Prefetch during low-traffic periods

3. **Response Compression**
   - Enable gzip compression for API responses
   - Reduce bandwidth usage

4. **Lazy Loading**
   - Load chart data only when requested
   - Don't fetch all markets on initial load

### Monitoring Metrics

- API response times
- Cache hit/miss ratio
- API rate limit usage
- Error rates by provider
- User request patterns

## Security Considerations

1. **API Key Protection**
   - Store keys in environment variables
   - Never expose in frontend code
   - Rotate keys periodically

2. **Rate Limiting**
   - Implement per-user rate limits
   - Prevent API quota exhaustion
   - Use existing rate limiter middleware

3. **Input Validation**
   - Validate market type parameter
   - Validate symbol format
   - Sanitize user inputs

4. **Authentication**
   - Require authentication for all market endpoints
   - Use existing JWT middleware

## Deployment Notes

### Environment Setup

1. Register for Alpha Vantage API key (free)
2. Add API key to server/.env
3. Verify CoinGecko API accessibility
4. Test API connectivity before deployment

### Production Considerations

- Consider upgrading to paid API tiers for higher limits
- Implement Redis for distributed caching
- Add API health monitoring
- Set up alerts for API failures
- Consider WebSocket for real-time updates (future enhancement)

## Future Enhancements

1. **WebSocket Integration**
   - Real-time price streaming
   - Eliminate polling overhead

2. **Advanced Caching**
   - Redis for distributed cache
   - Cache warming strategies

3. **Additional Data Sources**
   - Binance API for crypto
   - IEX Cloud for stocks
   - Multiple provider fallbacks

4. **User Preferences**
   - Customizable refresh intervals
   - Favorite symbols
   - Price alerts

5. **Historical Data**
   - Extended chart periods
   - Technical indicators
   - Comparison charts
