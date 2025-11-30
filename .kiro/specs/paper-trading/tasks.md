# Implementation Plan

- [ ] 1. Database schema and migrations
- [x] 1.1 Create paper_accounts table migration




  - Create migration file with paper_accounts table schema
  - Include indexes for user_id and leaderboard queries
  - _Requirements: 1.2, 1.5, 5.3, 7.1_

- [x] 1.2 Create paper_account_resets table migration


  - Create migration file for reset history tracking
  - Include indexes for user_id and timestamp
  - _Requirements: 5.4_

- [x] 1.3 Run database migrations



  - Execute migrations to create new tables
  - Verify tables created successfully
  - _Requirements: 1.2, 5.4_

- [ ] 1.4 Write property test for database schema
  - **Property 1: Account initialization with correct balance**
  - **Validates: Requirements 1.2**

- [ ] 2. Backend repository layer
- [x] 2.1 Create paperAccountRepository.js


  - Implement createAccount method
  - Implement getAccountByUserId method
  - Implement updateBalance method
  - Implement recordReset method
  - Implement getResetHistory method
  - Implement getLeaderboardData method
  - Implement updateLeaderboardVisibility method
  - _Requirements: 1.2, 1.5, 5.2, 5.3, 5.4, 7.1, 7.5_

- [ ] 2.2 Write property test for account initialization
  - **Property 1: Account initialization with correct balance**
  - **Validates: Requirements 1.2**

- [ ] 2.3 Write property test for data isolation
  - **Property 2: Data isolation between trading modes**
  - **Validates: Requirements 1.4, 9.3**

- [ ] 2.4 Write property test for leaderboard privacy
  - **Property 20: Leaderboard privacy filtering**
  - **Validates: Requirements 7.5**

- [ ] 3. Backend service layer
- [x] 3.1 Create paperTradingService.js


  - Implement initializeAccount method
  - Implement getAccountSummary method
  - Implement calculatePerformance method
  - Implement validateOrder method
  - Implement executePaperOrder method
  - _Requirements: 1.2, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 10.1, 10.2_

- [ ] 3.2 Write property test for buy order validation
  - **Property 4: Buy order validation**
  - **Validates: Requirements 2.1**

- [ ] 3.3 Write property test for sell order validation
  - **Property 5: Sell order validation**
  - **Validates: Requirements 2.2**

- [ ] 3.4 Write property test for order execution atomicity
  - **Property 6: Order execution atomicity**
  - **Validates: Requirements 2.3**

- [ ] 3.5 Write property test for portfolio value calculation
  - **Property 8: Portfolio value calculation**
  - **Validates: Requirements 3.2**

- [ ] 3.6 Write property test for profit/loss calculation
  - **Property 9: Profit/loss calculation accuracy**
  - **Validates: Requirements 3.3**

- [x] 3.7 Implement resetAccount method in service

  - Clear all paper holdings for user
  - Clear all paper orders for user
  - Reset balance to $100,000
  - Record reset event
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 3.8 Write property test for account reset
  - **Property 14: Account reset clears holdings**
  - **Property 15: Account reset restores balance**
  - **Property 16: Reset event logging**
  - **Validates: Requirements 5.2, 5.3, 5.4**

- [x] 3.9 Implement getLeaderboard method in service

  - Query top performers by portfolio value
  - Filter out users with leaderboard_visible=false
  - Include current user's rank
  - Calculate portfolio values (balance + holdings)
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ] 3.10 Write property test for leaderboard ranking
  - **Property 17: Leaderboard ranking order**
  - **Property 18: Leaderboard entry completeness**
  - **Property 19: Current user in leaderboard**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 3.11 Implement updateLeaderboardVisibility method

  - Update user's leaderboard_visible flag
  - _Requirements: 7.5_

- [ ] 3.12 Write property test for exchange API isolation
  - **Property 21: Exchange API isolation**
  - **Validates: Requirements 9.2**

- [ ] 4. Backend controller layer
- [x] 4.1 Create paperTradingController.js


  - Implement getAccount endpoint handler
  - Implement resetAccount endpoint handler
  - Implement getStatistics endpoint handler
  - Implement getLeaderboard endpoint handler
  - Implement updateLeaderboardVisibility endpoint handler
  - Add authentication middleware
  - Add input validation
  - Add error handling
  - _Requirements: 1.2, 1.5, 5.2, 5.3, 7.1, 7.5, 10.1, 10.2_

- [ ] 4.2 Write unit tests for controller endpoints
  - Test authentication requirements
  - Test input validation
  - Test error responses
  - Test success responses
  - _Requirements: 1.2, 1.5, 5.2, 7.1_

- [ ] 5. Backend API routes
- [x] 5.1 Create paperTradingRoutes.js


  - Define GET /api/paper-trading/account route
  - Define POST /api/paper-trading/account/reset route
  - Define GET /api/paper-trading/statistics route
  - Define GET /api/paper-trading/leaderboard route
  - Define PUT /api/paper-trading/leaderboard/visibility route
  - Apply authentication middleware
  - Apply rate limiting
  - _Requirements: 1.2, 1.5, 5.2, 7.1, 7.5_

- [x] 5.2 Register paper trading routes in server.js


  - Import paperTradingRoutes
  - Mount routes at /api/paper-trading
  - _Requirements: 1.2_

- [x] 5.3 Extend existing holdings and orders endpoints


  - Add account parameter support to holdings endpoints
  - Add account parameter support to orders endpoints
  - Add account parameter support to portfolio endpoints
  - Ensure proper filtering by account type
  - _Requirements: 1.4, 2.3, 3.1, 4.1, 9.3, 9.5_

- [ ] 5.4 Write property test for paper operations data isolation
  - **Property 22: Paper operations data isolation**
  - **Validates: Requirements 9.5**

- [ ] 6. Checkpoint - Backend foundation complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Frontend services
- [x] 7.1 Create paperTradingService.js


  - Implement getAccount API call
  - Implement resetAccount API call
  - Implement getStatistics API call
  - Implement getLeaderboard API call
  - Implement updateLeaderboardVisibility API call
  - Add error handling
  - _Requirements: 1.2, 1.5, 5.2, 7.1, 7.5_

- [x] 7.2 Extend existing services for paper trading mode

  - Add account parameter to holdingsService calls
  - Add account parameter to ordersService calls
  - Add account parameter to portfolioService calls
  - _Requirements: 1.4, 2.3, 3.1_

- [ ] 8. Frontend components - Core UI
- [x] 8.1 Create PracticeModeBanner.jsx component


  - Display prominent "PRACTICE MODE" banner
  - Show virtual balance
  - Add link to switch to real trading
  - Style with distinct colors (e.g., orange/yellow theme)
  - _Requirements: 1.3, 8.1, 8.4_

- [x] 8.2 Create PaperTradingPage.jsx


  - Set up page layout with practice mode banner
  - Add state management for paper account
  - Add state management for holdings
  - Add state management for orders
  - Fetch paper account data on mount
  - _Requirements: 1.1, 1.3, 1.5_

- [x] 8.3 Create PaperTradingInterface.jsx component


  - Add asset search/selection
  - Add buy/sell toggle
  - Add quantity input
  - Add current price display
  - Add total cost calculation
  - Add order validation
  - Add submit button
  - Handle order execution
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ] 8.4 Write unit tests for trading interface
  - Test form validation
  - Test order submission
  - Test error handling
  - _Requirements: 2.1, 2.2_

- [ ] 9. Frontend components - Portfolio display
- [x] 9.1 Create PaperPortfolio.jsx component


  - Display holdings table with virtual indicators
  - Show symbol, quantity, avg buy price, current price
  - Calculate and display total value per holding
  - Calculate and display profit/loss per holding
  - Calculate and display profit/loss percentage
  - Show total portfolio value
  - Show overall profit/loss
  - Add "VIRTUAL" labels to all currency amounts
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.4_

- [ ] 9.2 Write property test for portfolio calculations
  - **Property 10: Percentage gain calculation**
  - **Validates: Requirements 3.4**

- [x] 9.3 Create PaperTransactionHistory.jsx component


  - Display orders table
  - Show date, time, asset, type, quantity, price, total
  - Add filters for asset type, date range, transaction type
  - Sort by date descending
  - Calculate P/L for closed positions
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 9.4 Write property test for transaction ordering
  - **Property 11: Transaction history ordering**
  - **Validates: Requirements 4.1**

- [ ] 9.5 Write property test for transaction filtering
  - **Property 13: Transaction filtering correctness**
  - **Validates: Requirements 4.3**

- [ ] 10. Frontend components - Account management
- [x] 10.1 Create ResetAccountModal.jsx component


  - Display warning message about data loss
  - Show current balance and holdings count
  - Add confirmation checkbox
  - Add "Reset Account" button
  - Add "Cancel" button
  - Handle reset API call
  - Show success message
  - Refresh account data after reset
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 10.2 Add reset button to PaperTradingPage

  - Add "Reset Account" button to page header
  - Open ResetAccountModal on click
  - _Requirements: 5.1_

- [ ] 10.3 Write unit tests for reset modal
  - Test confirmation flow
  - Test cancel action
  - Test reset success
  - _Requirements: 5.1, 5.2_



- [ ] 11. Frontend components - Educational features
- [ ] 11.1 Create TradingTooltip.jsx component
  - Implement hover/click tooltip
  - Add educational content for key concepts


  - Style consistently with app theme
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 11.2 Add educational tooltips to trading interface


  - Add tooltip for order types
  - Add tooltip for market prices
  - Add tooltip for quantity/total calculations
  - _Requirements: 6.1, 6.2_

- [x] 11.3 Add educational tooltips to portfolio display



  - Add tooltip for ROI
  - Add tooltip for profit/loss
  - Add tooltip for diversification
  - Add links to trading guides
  - _Requirements: 6.3, 6.4_

- [ ] 12. Frontend components - Performance analytics
- [ ] 12.1 Create PaperPerformanceChart.jsx component
  - Display portfolio value over time as line chart
  - Add timeframe selector (1D, 1W, 1M, 3M, 1Y, ALL)
  - Fetch performance data from API
  - Use Chart.js or similar library
  - _Requirements: 10.1_

- [ ] 12.2 Create PaperPerformanceMetrics.jsx component
  - Display total return
  - Display win rate
  - Display average trade size
  - Display Sharpe ratio
  - Display max drawdown
  - Display best and worst trades
  - _Requirements: 10.2, 10.3, 10.4_

- [ ] 12.3 Write property test for performance metrics
  - **Property 24: Performance metrics calculation**
  - **Property 25: Best and worst trade identification**
  - **Validates: Requirements 10.2, 10.4**

- [ ] 12.4 Add performance section to PaperTradingPage
  - Add performance chart
  - Add performance metrics cards
  - _Requirements: 10.1, 10.2_

- [ ] 13. Frontend components - Leaderboard (optional)
- [ ] 13.1 Create PaperTradingLeaderboard.jsx component
  - Display top performers table
  - Show rank, username, portfolio value, % gain
  - Highlight current user's row
  - Add opt-in/opt-out toggle
  - Handle visibility update API call
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ] 13.2 Create leaderboard page route
  - Add /paper-trading/leaderboard route
  - Render PaperTradingLeaderboard component
  - Add navigation link from main paper trading page
  - _Requirements: 7.1_

- [ ] 13.3 Write unit tests for leaderboard component
  - Test data display
  - Test current user highlighting
  - Test opt-out toggle
  - _Requirements: 7.1, 7.3, 7.5_

- [ ] 14. Frontend routing and navigation
- [x] 14.1 Add paper trading routes to App.jsx


  - Add /paper-trading route
  - Add /paper-trading/stats route (optional)
  - Add /paper-trading/leaderboard route (optional)
  - Ensure authentication required
  - _Requirements: 1.1_

- [x] 14.2 Add paper trading link to navigation



  - Add "Paper Trading" link to Sidebar component
  - Add icon for paper trading
  - Highlight when on paper trading pages
  - _Requirements: 1.1_



- [x] 14.3 Add mode switcher component


  - Create toggle to switch between real and paper trading
  - Update context/state when switching modes


  - Ensure data isolation when switching
  - _Requirements: 1.4, 8.3_

- [ ] 15. Frontend styling and visual distinction
- [ ] 15.1 Create paper trading CSS module
  - Define distinct color scheme for practice mode (e.g., orange/yellow)
  - Style practice mode banner


  - Style virtual currency indicators
  - Ensure consistent styling across all paper trading components
  - _Requirements: 1.3, 8.1, 8.2, 8.4_

- [ ] 15.2 Add "VIRTUAL" labels to all currency displays
  - Update PaperPortfolio to show "VIRTUAL" labels
  - Update PaperTradingInterface to show "VIRTUAL" labels
  - Update PracticeModeBanner to show "VIRTUAL" labels
  - Style labels distinctly
  - _Requirements: 8.4_

- [ ] 15.3 Prevent real account actions in practice mode
  - Disable connect account button in practice mode
  - Show explanation message when attempted
  - Add visual indicators that feature is unavailable
  - _Requirements: 8.5_

- [ ] 15.4 Write property test for account connection prevention
  - **Property 8.5: Exchange account connection prevention**
  - **Validates: Requirements 8.5**

- [ ] 16. Integration and testing
- [ ] 16.1 Write integration tests for complete trading flow
  - Test account creation → buy order → holdings update → sell order → balance update
  - Test reset flow
  - Test mode switching
  - _Requirements: 1.2, 2.3, 5.2, 1.4_

- [ ] 16.2 Write integration tests for leaderboard
  - Test multiple users with different performance
  - Test ranking calculation
  - Test opt-out functionality
  - _Requirements: 7.1, 7.3, 7.5_

- [ ] 16.3 Manual testing checklist
  - Navigate to /paper-trading and verify page loads
  - Verify practice mode banner displays
  - Execute buy order and verify holdings update
  - Execute sell order and verify balance update
  - Verify portfolio calculations are correct
  - Test reset functionality
  - Test leaderboard (if enabled)
  - Test mode switching
  - Verify data isolation between modes
  - _Requirements: All_

- [ ] 17. Final checkpoint - Complete system test
  - Ensure all tests pass, ask the user if questions arise.
