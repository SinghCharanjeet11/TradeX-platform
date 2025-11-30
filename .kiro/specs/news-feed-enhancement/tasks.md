# Implementation Plan

- [x] 1. Database setup and migrations


  - Create bookmarks table with proper indexes
  - Add migration script for bookmarks table
  - _Requirements: 9.1, 9.3, 9.4_

- [ ] 2. News Provider implementation
  - [x] 2.1 Create newsProvider.js with CryptoCompare API integration


    - Implement getNews() method with filtering options
    - Implement getBreakingNews() method
    - Implement getNewsBySymbols() method
    - Implement transformArticle() to convert external format to internal format
    - Add error handling and timeout logic
    - _Requirements: 1.1, 1.2_

- [ ] 3. News Repository implementation
  - [x] 3.1 Create newsRepository.js for bookmark operations


    - Implement addBookmark() method
    - Implement removeBookmark() method
    - Implement getBookmarks() method
    - Implement isBookmarked() method
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 4. News Service implementation
  - [x] 4.1 Create enhanced newsService.js with business logic



    - Implement getNews() with caching and filtering
    - Implement getPersonalizedNews() using user holdings/watchlist
    - Implement getBreakingNews() with cache
    - Implement calculateSentiment() for sentiment analysis
    - Implement filterBySearch() with debouncing
    - Add cache integration with 5-minute TTL
    - Add fallback to stale cache on provider failure
    - _Requirements: 1.1, 1.4, 1.5, 2.1, 2.2, 3.1, 3.2, 3.3, 6.1, 6.2, 7.1, 7.2, 7.3, 7.4, 8.1_

- [ ] 5. News Controller updates
  - [x] 5.1 Update newsController.js with new endpoints


    - Update getNews() to support all filter parameters
    - Add getPersonalizedNews() endpoint
    - Update getBreakingNews() endpoint
    - Add toggleBookmark() endpoint
    - Add getBookmarks() endpoint
    - Add proper error handling and validation
    - _Requirements: 1.1, 3.1, 3.2, 6.1, 9.1, 9.2, 9.3_

- [ ] 6. News Routes updates
  - [x] 6.1 Update newsRoutes.js with new endpoints


    - Add GET /api/news with query parameters
    - Add GET /api/news/personalized
    - Add GET /api/news/breaking
    - Add POST /api/news/bookmarks
    - Add GET /api/news/bookmarks
    - Add authentication middleware to protected routes
    - _Requirements: 1.1, 3.1, 6.1, 9.1, 9.2_

- [ ] 7. Client news service updates
  - [x] 7.1 Update client newsService.js


    - Update getNews() to pass filter parameters
    - Add getPersonalizedNews() method
    - Update getBreakingNews() method
    - Add toggleBookmark() method
    - Add getBookmarks() method
    - Add proper error handling
    - _Requirements: 1.1, 2.1, 3.1, 6.1, 9.1, 9.2_

- [ ] 8. Search component implementation
  - [x] 8.1 Create SearchBar component


    - Implement debounced search input (300ms)
    - Add search icon and clear button
    - Emit search query changes to parent
    - Style with trading theme
    - _Requirements: 2.1, 2.5_

- [ ] 9. Article Modal component
  - [x] 9.1 Create ArticleModal component


    - Display full article content with title, body, source, timestamp
    - Add external link button that opens in new tab
    - Add close button and click-outside-to-close
    - Prevent background scrolling when open
    - Add bookmark toggle button
    - Add sentiment indicator
    - Style with trading theme
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 9.1_

- [x] 10. News filters component

  - [x] 10.1 Create NewsFilters component


    - Add category filter buttons
    - Add sentiment filter dropdown
    - Add date range filter
    - Apply filters using AND logic
    - Show active filter count
    - Add clear all filters button
    - _Requirements: 5.1, 5.2, 5.3, 5.4_


- [ ] 11. Breaking news section
  - [x] 11.1 Create BreakingNewsSection component


    - Display breaking news in prominent section
    - Show only articles less than 2 hours old
    - Sort by reverse chronological order
    - Add urgent keyword badge detection
    - Add dismiss functionality with session persistence
    - Auto-refresh every 2 minutes
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 12. Sentiment indicator component
  - [x] 12.1 Create SentimentIndicator component



    - Display positive indicator for score > 0.3
    - Display negative indicator for score < -0.3
    - Display neutral indicator for -0.3 ≤ score ≤ 0.3
    - Hide indicator when sentiment unavailable
    - Add tooltip with sentiment score
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 13. Update NewsPage component
  - [x] 13.1 Refactor NewsPage to use real API



    - Remove mock data
    - Integrate with newsService API calls
    - Add SearchBar component
    - Add NewsFilters component
    - Add BreakingNewsSection component
    - Add ArticleModal integration
    - Add loading states and error handling
    - Add auto-refresh every 5 minutes
    - Add personalized feed toggle
    - Add bookmarks section
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 3.1, 3.3, 4.1, 5.1, 6.1, 9.2, 9.5_


- [ ] 14. Update useNews hook
  - [x] 14.1 Enhance useNews hook with new features


    - Add filter state management
    - Add search query state with debouncing
    - Add auto-refresh logic (5 minutes)
    - Add error state and retry logic
    - Add cache status indicator
    - _Requirements: 1.5, 2.5, 10.1, 10.4_

- [ ] 15. Environment configuration
  - [x] 15.1 Add CryptoCompare API configuration



    - Add CRYPTOCOMPARE_API_KEY to .env
    - Add NEWS_CACHE_TTL configuration
    - Add NEWS_STALE_CACHE_TTL configuration
    - Update apiConfig.js with news provider settings

    - _Requirements: 1.1, 7.2, 7.3_

- [x] 16. Error handling enhancements

  - [x] 16.1 Implement comprehensive error handling


    - Add timeout handling with 30-second retry
    - Add invalid data validation and logging
    - Add offline indicator for network loss
    - Add persistent error notification (5 minutes)
    - Add graceful degradation to cached data
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
