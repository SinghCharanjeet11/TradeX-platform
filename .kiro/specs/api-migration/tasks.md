# Implementation Plan

- [x] 1. Update API configuration and environment setup





  - Update `server/config/apiConfig.js` with Finnhub, Fixer.io, and Metals-API configurations
  - Add new API keys to `.env.example` file
  - Update configuration validation to check for new API keys
  - Update cache TTL values (stocks: 60s, forex: 3600s, commodities: 3600s)
  - _Requirements: 1.5, 2.5, 3.4, 4.3, 5.3_

- [ ] 2. Implement Finnhub Stocks Provider
  - [x] 2.1 Create new StocksProvider class with Finnhub integration


    - Implement `getStockQuote(symbol)` method using Finnhub `/quote` endpoint
    - Implement `getMultipleStockQuotes(symbols)` with concurrent requests
    - Implement `getStockTimeSeries(symbol, interval)` using Finnhub `/stock/candle` endpoint
    - Implement `getCompanyOverview(symbol)` using Finnhub `/stock/profile2` endpoint
    - Add retry logic with exponential backoff
    - Add error handling and formatting
    - _Requirements: 1.1, 1.4, 4.5, 6.1, 6.4_

  - [x] 2.2 Write property test for stock data freshness






    - **Property 1: Data timestamp freshness**
    - **Validates: Requirements 1.2**
-

  - [x] 2.3 Write property test for cache TTL





    - **Property 2: Cache TTL correctness**
    - **Validates: Requirements 1.3**

  - [x] 2.4 Write property test for retry logic





    - **Property 3: Exponential backoff retry**
    - **Validates: Requirements 1.4, 6.1**

  - [x] 2.5 Create data transformer for Finnhub responses


    - Transform Finnhub quote format to standard format
    - Transform Finnhub candle data to time series format
    - Transform company profile to overview format
    - Handle missing or null fields gracefully
    - _Requirements: 4.2, 4.4_
-

  - [x] 2.6 Write property test for data transformation





    - **Property 8: Data transformation consistency**
    - **Validates: Requirements 4.2, 4.4**
-

  - [x] 2.7 Write unit tests for StocksProvider





    - Test API request construction
    - Test error handling for different error types
    - Test cache integration
    - _Requirements: 1.1, 1.4, 4.5_




- [ ] 3. Implement Fixer.io Forex Provider

  - [x] 3.1 Create new ForexProvider class with Fixer.io integration


    - Implement `getExchangeRate(fromCurrency, toCurrency)` using Fixer `/latest` endpoint
    - Implement `getMultipleExchangeRates(pairs)` with batched request
    - Implement `getForexTimeSeries(fromCurrency, toCurrency, interval)` using historical endpoint



    - Add retry logic with exponential backoff
    - Add error handling and formatting

    - _Requirements: 2.1, 2.4, 4.5, 6.1, 6.4_






  - [ ] 3.2 Write property test for forex data freshness





    - **Property 4: Forex timestamp freshness**


    - **Validates: Requirements 2.2**

  - [ ] 3.3 Write property test for batch request efficiency







    - **Property 5: Batch request efficiency**
    - **Validates: Requirements 2.4**

  - [x] 3.4 Write property test for cache TTL



    - **Property 2: Cache TTL correctness**
    - **Validates: Requirements 2.3**

  - [x] 3.5 Create data transformer for Fixer.io responses



    - Transform Fixer rates to exchange rate format
    - Calculate change and changePercent from historical data




    - Handle missing or null fields gracefully


    - _Requirements: 4.2, 4.4_

  - [x] 3.6 Write unit tests for ForexProvider





    - Test API request construction with batching
    - Test error handling
    - Test cache integration




    - _Requirements: 2.1, 2.4, 4.5_


- [x] 4. Implement Metals-API Commodities Provider




  - [x] 4.1 Create new CommoditiesProvider class with Metals-API integration


    - Implement `getCommodityPrice(symbol)` using Metals-API `/latest` endpoint
    - Implement `getMultipleCommodityPrices(commodities)` with batched request





    - Implement `getCommodityTimeSeries(symbol, interval)` using historical endpoint


    - Add retry logic with exponential backoff



    - Add error handling and formatting
    - _Requirements: 3.1, 3.5, 4.5, 6.1, 6.2, 6.4_




  - [x] 4.2 Write property test for commodity symbol completeness








    - **Property 6: Commodity symbol completeness**





    - **Validates: Requirements 3.2**

  - [x] 4.3 Write property test for cache TTL


    - **Property 2: Cache TTL correctness**
    - **Validates: Requirements 3.3**



  - [x] 4.4 Write property test for cache fallback










    - **Property 7: Cache fallback on failure**
    - **Validates: Requirements 3.5, 6.2**

  - [x] 4.5 Create data transformer for Metals-API responses


    - Transform Metals-API rates to commodity price format
    - Convert rates to prices (handle inverse rates)
    - Add commodity metadata (name, unit)
    - Handle missing or null fields gracefully
    - _Requirements: 4.2, 4.4_

  - [x] 4.6 Write unit tests for CommoditiesProvider


    - Test API request construction with batching
    - Test error handling and cache fallback
    - Test cache integration
    - _Requirements: 3.1, 3.5, 4.5_

- [ ] 5. Implement shared error handling and utilities

  - [ ] 5.1 Create consistent error formatting utility

    - Implement error formatter that creates standard error objects
    - Add error classification (retryable vs non-retryable)
    - Add provider-specific error mapping
    - _Requirements: 4.5, 6.4_

  - [ ] 5.2 Write property test for error format consistency


    - **Property 9: Error format consistency**
    - **Validates: Requirements 4.5**

  - [ ] 5.3 Write property test for error classification


    - **Property 10: Error classification accuracy**
    - **Validates: Requirements 6.4**

  - [ ] 5.4 Create retry utility with exponential backoff

    - Implement configurable retry logic
    - Add exponential backoff calculation
    - Add retry condition checking
    - _Requirements: 1.4, 6.1_

  - [ ] 5.5 Write unit tests for error handling utilities


    - Test error formatting
    - Test error classification
    - Test retry logic
    - _Requirements: 4.5, 6.4_

- [x] 6. Update documentation and environment files



  - Update `.env.example` with new API keys and registration links
  - Update `README.md` with API setup instructions
  - Create `API_MIGRATION_GUIDE.md` with migration steps
  - Update API configuration documentation with rate limits and data freshness
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 7. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Integration testing and validation

  - Test end-to-end flow with real API keys
  - Verify rate limit handling
  - Verify cache behavior
  - Verify error handling and fallbacks
  - Monitor API usage and response times
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 6.1, 6.2, 6.3_
