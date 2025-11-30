# Design Document

## Overview

This design document details the migration from Alpha Vantage API to three specialized free APIs that offer better rate limits and data freshness. The migration will replace the existing `stocksProvider.js`, `forexProvider.js`, and `commoditiesProvider.js` implementations while maintaining backward compatibility with the rest of the application.

## Architecture

### Current Architecture
```
marketService.js
    ↓
stocksProvider.js (Alpha Vantage)
forexProvider.js (Alpha Vantage)
commoditiesProvider.js (Alpha Vantage)
    ↓
cacheService.js
```

### New Architecture
```
marketService.js
    ↓
stocksProvider.js (Finnhub)
forexProvider.js (Fixer.io)
commoditiesProvider.js (Metals-API)
    ↓
cacheService.js
```

The architecture remains the same, only the underlying API providers change.

## Components and Interfaces

### 1. API Configuration (`apiConfig.js`)

Update configuration to include new API providers:

```javascript
export const apiConfig = {
  // Existing CoinGecko config remains unchanged
  coingecko: { ... },
  
  // NEW: Finnhub API Configuration
  finnhub: {
    apiKey: process.env.FINNHUB_API_KEY,
    baseUrl: 'https://finnhub.io/api/v1',
    timeout: 15000,
    rateLimit: {
      callsPerMinute: 60,
      callsPerDay: 'unlimited' // Free tier
    }
  },
  
  // NEW: Fixer.io API Configuration
  fixer: {
    apiKey: process.env.FIXER_API_KEY,
    baseUrl: 'http://data.fixer.io/api',
    timeout: 15000,
    rateLimit: {
      callsPerMonth: 100 // Free tier
    }
  },
  
  // NEW: Metals-API Configuration
  metalsApi: {
    apiKey: process.env.METALS_API_KEY,
    baseUrl: 'https://metals-api.com/api',
    timeout: 15000,
    rateLimit: {
      callsPerMonth: 50 // Free tier
    }
  },
  
  // Updated cache TTL
  cache: {
    crypto: 60,        // 1 minute (improved from 5 min)
    stocks: 60,        // 1 minute (improved from 10 min)
    forex: 3600,       // 1 hour (to respect monthly limits)
    commodities: 3600, // 1 hour (to respect monthly limits)
    charts: 1800       // 30 minutes (unchanged)
  }
}
```

### 2. Stocks Provider (`stocksProvider.js`)

**Finnhub API Integration**

Key endpoints:
- Quote: `/quote?symbol={symbol}`
- Company Profile: `/stock/profile2?symbol={symbol}`
- Candles: `/stock/candle?symbol={symbol}&resolution={resolution}&from={from}&to={to}`

Interface methods:
```javascript
class StocksProvider {
  async getStockQuote(symbol)
  async getMultipleStockQuotes(symbols)
  async getStockTimeSeries(symbol, interval)
  async getCompanyOverview(symbol)
}
```

Data transformation:
- Finnhub returns: `{c: currentPrice, h: high, l: low, o: open, pc: previousClose}`
- Transform to: `{price, high, low, open, previousClose, change, changePercent}`

### 3. Forex Provider (`forexProvider.js`)

**Fixer.io API Integration**

Key endpoints:
- Latest rates: `/latest?base={base}&symbols={symbols}`
- Historical: `/historical/{date}?base={base}&symbols={symbols}`

Interface methods:
```javascript
class ForexProvider {
  async getExchangeRate(fromCurrency, toCurrency)
  async getMultipleExchangeRates(pairs)
  async getForexTimeSeries(fromCurrency, toCurrency, interval)
}
```

Data transformation:
- Fixer returns: `{success: true, rates: {USD: 1.18, GBP: 0.85}}`
- Transform to: `{rate, timestamp, fromCurrency, toCurrency}`

### 4. Commodities Provider (`commoditiesProvider.js`)

**Metals-API Integration**

Key endpoints:
- Latest rates: `/latest?base={base}&symbols={symbols}`
- Specific date: `/{date}?base={base}&symbols={symbols}`

Supported symbols: XAU (Gold), XAG (Silver), XPT (Platinum), XPD (Palladium), CRUDE_OIL_WTI, CRUDE_OIL_BRENT, NATURAL_GAS

Interface methods:
```javascript
class CommoditiesProvider {
  async getCommodityPrice(symbol)
  async getMultipleCommodityPrices(commodities)
  async getCommodityTimeSeries(symbol, interval)
}
```

Data transformation:
- Metals-API returns: `{success: true, rates: {XAU: 0.000526}}`
- Transform to: `{price, symbol, name, unit, change, changePercent}`

## Data Models

### Stock Quote Response
```javascript
{
  symbol: string,
  name: string,
  price: number,
  change: number,
  changePercent: number,
  high: number,
  low: number,
  open: number,
  previousClose: number,
  volume: number,
  timestamp: number
}
```

### Forex Rate Response
```javascript
{
  pair: string,
  rate: number,
  fromCurrency: string,
  toCurrency: string,
  timestamp: number,
  change: number,
  changePercent: number
}
```

### Commodity Price Response
```javascript
{
  symbol: string,
  name: string,
  price: number,
  unit: string,
  change: number,
  changePercent: number,
  timestamp: number
}
```

## C
orrectness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


Property 1: Data timestamp freshness
*For any* stock data response, the timestamp should be within the last 60 seconds of the current time
**Validates: Requirements 1.2**

Property 2: Cache TTL correctness
*For any* cached data entry, the TTL should match the configured cache duration for that data type (60s for stocks, 3600s for forex/commodities)
**Validates: Requirements 1.3, 2.3, 3.3**

Property 3: Exponential backoff retry
*For any* failed API request that is retryable, subsequent retry attempts should have exponentially increasing delays
**Validates: Requirements 1.4, 6.1**

Property 4: Forex timestamp freshness
*For any* forex data response, the timestamp should be within the last 3600 seconds of the current time
**Validates: Requirements 2.2**

Property 5: Batch request efficiency
*For any* request for multiple currency pairs, the system should make a single API call rather than multiple individual calls
**Validates: Requirements 2.4**

Property 6: Commodity symbol completeness
*For any* commodity data response, it should include all requested commodity symbols (gold, silver, crude oil, etc.)
**Validates: Requirements 3.2**

Property 7: Cache fallback on failure
*For any* API call that fails, if cached data exists for that request, the cached data should be returned
**Validates: Requirements 3.5, 6.2**

Property 8: Data transformation consistency
*For any* API response, the transformed output should contain all required fields in the standard format (price, symbol, timestamp, change, changePercent)
**Validates: Requirements 4.2, 4.4**

Property 9: Error format consistency
*For any* error from any provider (stocks, forex, commodities), the error object should have the same structure (provider, method, message, statusCode)
**Validates: Requirements 4.5**

Property 10: Error classification accuracy
*For any* error, the system should correctly identify whether it is retryable (network errors, 5xx) or non-retryable (4xx, rate limits)
**Validates: Requirements 6.4**

## Error Handling

### Error Types

1. **Network Errors**: Timeout, connection refused, DNS failure
   - Action: Retry with exponential backoff (up to 3 attempts)
   - Fallback: Return cached data if available

2. **API Errors**:
   - 4xx (Client errors): Invalid symbol, missing API key, malformed request
     - Action: Do not retry, return error immediately
   - 5xx (Server errors): API service down, internal server error
     - Action: Retry with exponential backoff
   - 429 (Rate limit): Too many requests
     - Action: Do not retry immediately, log event, return cached data

3. **Configuration Errors**: Missing or invalid API keys
   - Action: Log error with setup instructions, fail gracefully

4. **Data Transformation Errors**: Invalid response format
   - Action: Log error, return cached data if available

### Error Response Format

All providers return errors in consistent format:
```javascript
{
  provider: string,      // 'Finnhub', 'Fixer', 'Metals-API'
  method: string,        // Method name that failed
  message: string,       // User-friendly error message
  statusCode: number,    // HTTP status code (0 for network errors)
  originalError: string, // Original error message for debugging
  retryable: boolean     // Whether error is retryable
}
```

### Retry Logic

Exponential backoff configuration:
- Initial delay: 1000ms
- Max delay: 5000ms
- Backoff multiplier: 2
- Max attempts: 3

Delay calculation: `min(initialDelay * (multiplier ^ attempt), maxDelay)`

## Testing Strategy

### Unit Testing

Unit tests will cover:
- API request construction with correct endpoints and parameters
- Response data transformation to standard format
- Error handling for different error types
- Cache integration (set, get, fallback)
- Configuration validation

### Property-Based Testing

Property-based tests will verify:
- Data freshness properties (timestamps within expected ranges)
- Cache TTL correctness across all data types
- Retry logic with exponential backoff
- Batch request efficiency
- Data transformation consistency
- Error format consistency
- Cache fallback behavior

Testing framework: We will use `fast-check` for JavaScript property-based testing.

Each property-based test will:
- Run a minimum of 100 iterations
- Generate random valid inputs
- Verify the property holds for all inputs
- Be tagged with the corresponding correctness property number

### Integration Testing

Integration tests will verify:
- End-to-end data flow from API to cache to response
- Multiple provider coordination
- Real API calls (with test API keys)
- Rate limit handling

## Migration Strategy

### Phase 1: Preparation
1. Obtain API keys for Finnhub, Fixer.io, and Metals-API
2. Update environment variables
3. Update API configuration

### Phase 2: Implementation
1. Implement new StocksProvider with Finnhub
2. Implement new ForexProvider with Fixer.io
3. Implement new CommoditiesProvider with Metals-API
4. Update data transformers

### Phase 3: Testing
1. Run unit tests
2. Run property-based tests
3. Run integration tests
4. Manual testing with real API calls

### Phase 4: Deployment
1. Update documentation
2. Deploy to staging
3. Monitor API usage and errors
4. Deploy to production

## API Comparison

| Feature | Alpha Vantage (Old) | Finnhub (New) | Fixer.io (New) | Metals-API (New) |
|---------|-------------------|---------------|----------------|------------------|
| Rate Limit | 5/min, 25/day | 60/min | 100/month | 50/month |
| Data Delay | 15-20 min | Real-time | Hourly | Real-time |
| Free Tier | Yes | Yes | Yes | Yes |
| API Key Required | Yes | Yes | Yes | Yes |
| Data Quality | Good | Excellent | Excellent | Excellent |

## Environment Variables

New environment variables required:
```
FINNHUB_API_KEY=your_finnhub_api_key
FIXER_API_KEY=your_fixer_api_key
METALS_API_KEY=your_metals_api_key
```

Registration links:
- Finnhub: https://finnhub.io/register
- Fixer.io: https://fixer.io/signup/free
- Metals-API: https://metals-api.com/signup/free
