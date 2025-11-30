# Paper Trading Feature - Design Document

## Overview

The Paper Trading feature provides a complete virtual trading environment where users can practice trading strategies with a $100,000 virtual account. The system simulates real market conditions using live market data while maintaining complete isolation from real trading accounts. This design leverages the existing TradeX architecture for holdings, orders, and portfolio management, extending it with a "paper" account mode.

### Key Design Principles

1. **Data Isolation**: Complete separation between paper and real trading data
2. **Real Market Simulation**: Use actual market prices for realistic practice
3. **Clear Mode Distinction**: Unmistakable visual indicators for practice mode
4. **Reusable Architecture**: Leverage existing services with minimal duplication
5. **Educational Focus**: Provide learning opportunities throughout the experience

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Paper Trading│  │   Trading    │  │  Portfolio   │      │
│  │     Page     │  │  Interface   │  │   Display    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Paper Trading │  │   Holdings   │  │    Orders    │      │
│  │  Controller  │  │  Controller  │  │  Controller  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Paper Trading │  │   Holdings   │  │  Portfolio   │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Repository Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Paper Account │  │   Holdings   │  │    Orders    │      │
│  │  Repository  │  │  Repository  │  │  Repository  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │paper_accounts│  │   holdings   │  │    orders    │      │
│  │    table     │  │    table     │  │    table     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Account Mode Strategy

The system uses an `account` field to distinguish between real and paper trading:
- Real trading: `account = 'default'` or specific exchange names
- Paper trading: `account = 'paper'`

This approach allows reuse of existing tables (holdings, orders) while maintaining data isolation through query filters.

## Components and Interfaces

### Backend Components

#### 1. Paper Trading Controller (`paperTradingController.js`)

Handles HTTP requests for paper trading operations.

```javascript
class PaperTradingController {
  // Get or create paper trading account
  async getAccount(req, res)
  
  // Reset paper trading account to initial state
  async resetAccount(req, res)
  
  // Get paper trading statistics
  async getStatistics(req, res)
  
  // Get leaderboard (optional feature)
  async getLeaderboard(req, res)
  
  // Opt in/out of leaderboard
  async updateLeaderboardVisibility(req, res)
}
```

#### 2. Paper Trading Service (`paperTradingService.js`)

Business logic for paper trading operations.

```javascript
class PaperTradingService {
  // Initialize new paper account with $100k
  async initializeAccount(userId)
  
  // Get current paper account balance and stats
  async getAccountSummary(userId)
  
  // Reset account to initial state
  async resetAccount(userId)
  
  // Calculate performance metrics
  async calculatePerformance(userId)
  
  // Get leaderboard rankings
  async getLeaderboard(limit = 100)
  
  // Update leaderboard visibility
  async updateLeaderboardVisibility(userId, isVisible)
  
  // Validate paper trading order
  async validateOrder(userId, orderData)
  
  // Execute paper trading order
  async executePaperOrder(userId, orderData)
}
```

#### 3. Paper Account Repository (`paperAccountRepository.js`)

Data access for paper trading accounts.

```javascript
class PaperAccountRepository {
  // Create new paper account
  async createAccount(userId, initialBalance = 100000)
  
  // Get paper account by user ID
  async getAccountByUserId(userId)
  
  // Update account balance
  async updateBalance(userId, newBalance)
  
  // Record account reset
  async recordReset(userId)
  
  // Get account reset history
  async getResetHistory(userId)
  
  // Get leaderboard data
  async getLeaderboardData(limit)
  
  // Update leaderboard visibility
  async updateLeaderboardVisibility(userId, isVisible)
}
```

### Frontend Components

#### 1. Paper Trading Page (`PaperTradingPage.jsx`)

Main page component for paper trading interface.

```jsx
function PaperTradingPage() {
  // State management for paper account, holdings, orders
  // Layout with practice mode banner
  // Trading interface
  // Portfolio display
  // Performance charts
  // Reset button
}
```

#### 2. Practice Mode Banner (`PracticeModeBanner.jsx`)

Persistent banner indicating practice mode.

```jsx
function PracticeModeBanner() {
  // Prominent "PRACTICE MODE" indicator
  // Virtual balance display
  // Link to switch to real trading
}
```

#### 3. Paper Trading Interface (`PaperTradingInterface.jsx`)

Trading form for buy/sell orders in paper mode.

```jsx
function PaperTradingInterface() {
  // Asset selection
  // Order type (buy/sell)
  // Quantity input
  // Price display
  // Order validation
  // Educational tooltips
}
```

#### 4. Paper Portfolio Display (`PaperPortfolio.jsx`)

Shows virtual holdings and performance.

```jsx
function PaperPortfolio() {
  // Holdings table with virtual indicator
  // Total portfolio value
  // Profit/loss metrics
  // Asset allocation chart
}
```

#### 5. Reset Account Modal (`ResetAccountModal.jsx`)

Confirmation dialog for account reset.

```jsx
function ResetAccountModal() {
  // Warning message
  // Confirmation button
  // Cancel button
}
```

#### 6. Leaderboard Component (`PaperTradingLeaderboard.jsx`)

Optional leaderboard display.

```jsx
function PaperTradingLeaderboard() {
  // Top performers list
  // User's current rank
  // Opt-in/opt-out toggle
}
```

#### 7. Educational Tooltips (`TradingTooltip.jsx`)

Contextual educational content.

```jsx
function TradingTooltip({ concept, children }) {
  // Hover/click to show explanation
  // Links to detailed guides
}
```

## Data Models

### Database Schema

#### Paper Accounts Table

```sql
CREATE TABLE paper_accounts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  initial_balance DECIMAL(20, 2) DEFAULT 100000.00,
  current_balance DECIMAL(20, 2) DEFAULT 100000.00,
  total_invested DECIMAL(20, 2) DEFAULT 0.00,
  total_profit_loss DECIMAL(20, 2) DEFAULT 0.00,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  reset_count INTEGER DEFAULT 0,
  last_reset_at TIMESTAMP,
  leaderboard_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_paper_accounts_user_id ON paper_accounts(user_id);
CREATE INDEX idx_paper_accounts_leaderboard ON paper_accounts(current_balance DESC) 
  WHERE leaderboard_visible = true;
```

#### Paper Account Resets Table

```sql
CREATE TABLE paper_account_resets (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance_before_reset DECIMAL(20, 2),
  total_trades_before_reset INTEGER,
  profit_loss_before_reset DECIMAL(20, 2),
  reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_paper_resets_user_id ON paper_account_resets(user_id);
CREATE INDEX idx_paper_resets_date ON paper_account_resets(reset_at DESC);
```

#### Reuse Existing Tables

The system reuses existing `holdings` and `orders` tables with `account = 'paper'`:

**Holdings Table** (existing, no changes needed):
- Filter by `account = 'paper'` for paper trading holdings
- All existing columns work for paper trading

**Orders Table** (existing, no changes needed):
- Filter by `account = 'paper'` for paper trading orders
- All existing columns work for paper trading

### API Response Models

#### Paper Account Summary

```typescript
interface PaperAccountSummary {
  userId: string;
  currentBalance: number;
  initialBalance: number;
  totalInvested: number;
  portfolioValue: number;
  totalValue: number; // balance + portfolio value
  profitLoss: number;
  profitLossPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  resetCount: number;
  lastResetAt: string | null;
  createdAt: string;
}
```

#### Paper Trading Statistics

```typescript
interface PaperTradingStatistics {
  account: PaperAccountSummary;
  holdings: Holding[];
  recentTrades: Order[];
  performance: {
    dailyReturn: number;
    weeklyReturn: number;
    monthlyReturn: number;
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  topPerformers: {
    best: Holding[];
    worst: Holding[];
  };
}
```

#### Leaderboard Entry

```typescript
interface LeaderboardEntry {
  rank: number;
  username: string;
  portfolioValue: number;
  profitLoss: number;
  profitLossPercent: number;
  totalTrades: number;
  winRate: number;
  isCurrentUser: boolean;
}
```

## Correctness
 Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Account initialization with correct balance
*For any* user without an existing paper account, when they first access paper trading, the system should create an account with exactly $100,000 initial balance.
**Validates: Requirements 1.2**

### Property 2: Data isolation between trading modes
*For any* user with both real and paper trading data, queries filtered by account='paper' should never return records with account='default' and vice versa.
**Validates: Requirements 1.4, 9.3**

### Property 3: Account summary completeness
*For any* paper trading account, the account summary response should include current balance, holdings list, and all performance metrics (profit/loss, total trades, win rate).
**Validates: Requirements 1.5**

### Property 4: Buy order validation
*For any* buy order in paper trading mode, if the order total (quantity * price) exceeds the current balance, the system should reject the order.
**Validates: Requirements 2.1**

### Property 5: Sell order validation
*For any* sell order in paper trading mode, if the quantity exceeds the user's current holdings of that asset, the system should reject the order.
**Validates: Requirements 2.2**

### Property 6: Order execution atomicity
*For any* executed paper trading order, the balance and holdings updates should occur atomically such that balance + portfolio_value remains consistent before and after the transaction (accounting for the trade).
**Validates: Requirements 2.3**

### Property 7: Order record completeness
*For any* executed paper trading order, the order record should contain all required fields: timestamp, asset symbol, quantity, price, order type (buy/sell), and total value.
**Validates: Requirements 2.4**

### Property 8: Portfolio value calculation
*For any* paper trading portfolio, the total portfolio value should equal the sum of (quantity * current_price) across all holdings.
**Validates: Requirements 3.2**

### Property 9: Profit/loss calculation accuracy
*For any* holding in a paper trading portfolio, the profit/loss should equal (current_price - average_buy_price) * quantity.
**Validates: Requirements 3.3**

### Property 10: Percentage gain calculation
*For any* holding with non-zero cost basis, the percentage gain should equal ((current_value - cost_basis) / cost_basis) * 100.
**Validates: Requirements 3.4**

### Property 11: Transaction history ordering
*For any* user's paper trading transaction history, the returned orders should be sorted by execution timestamp in descending order (most recent first).
**Validates: Requirements 4.1**

### Property 12: Transaction record completeness
*For any* transaction in the history, the record should contain date, time, asset, type, quantity, price, and total value.
**Validates: Requirements 4.2**

### Property 13: Transaction filtering correctness
*For any* filter applied to transaction history (asset type, date range, or transaction type), the returned results should only include transactions matching all specified filter criteria.
**Validates: Requirements 4.3**

### Property 14: Account reset clears holdings
*For any* paper trading account, after a reset operation, all holdings with account='paper' for that user should be deleted.
**Validates: Requirements 5.2**

### Property 15: Account reset restores balance
*For any* paper trading account, after a reset operation, the current_balance should equal exactly $100,000.
**Validates: Requirements 5.3**

### Property 16: Reset event logging
*For any* account reset operation, a record should be created in the paper_account_resets table with the user_id, previous balance, and reset timestamp.
**Validates: Requirements 5.4**

### Property 17: Leaderboard ranking order
*For any* leaderboard query, the returned users should be sorted by total portfolio value (balance + holdings value) in descending order.
**Validates: Requirements 7.1**

### Property 18: Leaderboard entry completeness
*For any* entry in the leaderboard, the record should contain username, portfolio value, profit/loss, and percentage gain.
**Validates: Requirements 7.2**

### Property 19: Current user in leaderboard
*For any* leaderboard query by a user with a paper account, the response should include the current user's rank and stats.
**Validates: Requirements 7.3**

### Property 20: Leaderboard privacy filtering
*For any* leaderboard query, users with leaderboard_visible=false should not appear in the results.
**Validates: Requirements 7.5**

### Property 21: Exchange API isolation
*For any* paper trading order execution, the system should not make any calls to real exchange APIs (Binance, etc.).
**Validates: Requirements 9.2**

### Property 22: Paper operations data isolation
*For any* paper trading database operation (insert, update, delete), only records with account='paper' should be affected, never records with account='default' or other real account identifiers.
**Validates: Requirements 9.5**

### Property 23: Performance data availability
*For any* paper trading account, the performance analytics should return a time-series array of portfolio values with timestamps.
**Validates: Requirements 10.1**

### Property 24: Performance metrics calculation
*For any* paper trading account, the performance metrics (total return, win rate, average trade size) should be calculated correctly from the order history: win_rate = winning_trades / total_trades, total_return = (current_value - initial_balance) / initial_balance.
**Validates: Requirements 10.2**

### Property 25: Best and worst trade identification
*For any* paper trading account with closed positions, the best performing trade should have the highest profit/loss value, and the worst should have the lowest (most negative) profit/loss value.
**Validates: Requirements 10.4**

## Error Handling

### Error Categories

1. **Validation Errors** (400 Bad Request)
   - Insufficient balance for buy order
   - Insufficient holdings for sell order
   - Invalid order quantity (negative, zero, or non-numeric)
   - Invalid asset symbol
   - Missing required fields

2. **Authentication Errors** (401 Unauthorized)
   - Missing or invalid session token
   - Expired session

3. **Authorization Errors** (403 Forbidden)
   - Attempting to access another user's paper account
   - Attempting to modify another user's paper holdings

4. **Not Found Errors** (404 Not Found)
   - Paper account doesn't exist
   - Holding not found
   - Order not found

5. **Conflict Errors** (409 Conflict)
   - Attempting to create duplicate paper account
   - Concurrent order execution conflicts

6. **Server Errors** (500 Internal Server Error)
   - Database connection failures
   - Unexpected calculation errors
   - Market data service unavailable

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}
```

### Error Handling Strategies

1. **Validation Errors**: Return immediately with descriptive error message
2. **Database Errors**: Log error, return generic message to user, alert monitoring
3. **Market Data Errors**: Use cached prices if available, otherwise return error
4. **Concurrent Updates**: Use database transactions with appropriate isolation levels
5. **External Service Failures**: Graceful degradation (e.g., leaderboard unavailable)

## Testing Strategy

### Unit Testing

Unit tests will verify individual functions and components:

1. **Service Layer Tests**
   - Account initialization logic
   - Order validation rules
   - Balance calculation functions
   - Profit/loss calculations
   - Performance metric calculations
   - Reset operation logic

2. **Repository Layer Tests**
   - CRUD operations for paper accounts
   - Query filtering by account type
   - Transaction isolation
   - Leaderboard queries

3. **Controller Layer Tests**
   - Request validation
   - Response formatting
   - Error handling
   - Authentication/authorization checks

4. **Frontend Component Tests**
   - Component rendering
   - User interactions
   - State management
   - Form validation

### Property-Based Testing

Property-based tests will verify universal properties across many random inputs using **fast-check** (JavaScript property testing library):

1. **Configuration**: Each property test will run a minimum of 100 iterations
2. **Tagging**: Each test will include a comment with format: `**Feature: paper-trading, Property {number}: {property_text}**`
3. **Coverage**: Each correctness property from the design document will have one corresponding property-based test

**Property Test Examples**:

```javascript
// Property 1: Account initialization
test('Property 1: Account initialization with correct balance', async () => {
  // **Feature: paper-trading, Property 1: Account initialization with correct balance**
  await fc.assert(
    fc.asyncProperty(fc.uuid(), async (userId) => {
      const account = await paperTradingService.initializeAccount(userId);
      expect(account.currentBalance).toBe(100000);
      expect(account.initialBalance).toBe(100000);
    }),
    { numRuns: 100 }
  );
});

// Property 4: Buy order validation
test('Property 4: Buy order validation', async () => {
  // **Feature: paper-trading, Property 4: Buy order validation**
  await fc.assert(
    fc.asyncProperty(
      fc.uuid(),
      fc.double({ min: 1, max: 1000 }), // quantity
      fc.double({ min: 1, max: 10000 }), // price
      async (userId, quantity, price) => {
        const account = await paperTradingService.initializeAccount(userId);
        const orderTotal = quantity * price;
        
        if (orderTotal > account.currentBalance) {
          await expect(
            paperTradingService.executePaperOrder(userId, {
              type: 'buy',
              symbol: 'BTC',
              quantity,
              price
            })
          ).rejects.toThrow('Insufficient balance');
        }
      }
    ),
    { numRuns: 100 }
  );
});

// Property 8: Portfolio value calculation
test('Property 8: Portfolio value calculation', async () => {
  // **Feature: paper-trading, Property 8: Portfolio value calculation**
  await fc.assert(
    fc.asyncProperty(
      fc.uuid(),
      fc.array(fc.record({
        symbol: fc.string(),
        quantity: fc.double({ min: 0.01, max: 1000 }),
        currentPrice: fc.double({ min: 0.01, max: 10000 })
      })),
      async (userId, holdings) => {
        // Setup holdings in database
        for (const holding of holdings) {
          await holdingsRepository.createHolding(userId, {
            ...holding,
            account: 'paper',
            assetType: 'crypto',
            name: holding.symbol,
            avgBuyPrice: holding.currentPrice
          });
        }
        
        const summary = await paperTradingService.getAccountSummary(userId);
        const expectedValue = holdings.reduce(
          (sum, h) => sum + (h.quantity * h.currentPrice),
          0
        );
        
        expect(summary.portfolioValue).toBeCloseTo(expectedValue, 2);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Complete Trading Flow**
   - Create account → Place buy order → Verify holdings → Place sell order → Verify balance

2. **Reset Flow**
   - Create account → Execute trades → Reset → Verify clean state

3. **Leaderboard Flow**
   - Multiple users → Various performance → Verify rankings → Test opt-out

4. **Mode Switching**
   - Real trading operations → Switch to paper → Verify isolation → Switch back

### End-to-End Testing

E2E tests will verify user-facing workflows:

1. Navigate to /paper-trading
2. Verify practice mode banner displays
3. Execute buy order
4. Verify portfolio updates
5. Execute sell order
6. Verify balance updates
7. Reset account
8. Verify clean state

## API Endpoints

### Paper Trading Account Endpoints

```
GET    /api/paper-trading/account
POST   /api/paper-trading/account/reset
GET    /api/paper-trading/statistics
GET    /api/paper-trading/leaderboard
PUT    /api/paper-trading/leaderboard/visibility
```

### Reuse Existing Endpoints with Mode Parameter

```
GET    /api/holdings?account=paper
POST   /api/holdings?account=paper
PUT    /api/holdings/:id?account=paper
DELETE /api/holdings/:id?account=paper

GET    /api/orders?account=paper
POST   /api/orders?account=paper
GET    /api/orders/:id?account=paper

GET    /api/portfolio/summary?account=paper
GET    /api/portfolio/performance?account=paper
```

## Frontend Routes

```
/paper-trading          - Main paper trading page
/paper-trading/stats    - Detailed statistics and analytics
/paper-trading/leaderboard - Leaderboard view (optional)
```

## Security Considerations

1. **Authentication**: All paper trading endpoints require valid session
2. **Authorization**: Users can only access their own paper trading data
3. **Data Isolation**: Strict filtering by account type in all queries
4. **Rate Limiting**: Apply same rate limits as real trading to prevent abuse
5. **Input Validation**: Validate all order parameters (quantity, price, symbol)
6. **SQL Injection Prevention**: Use parameterized queries
7. **XSS Prevention**: Sanitize all user inputs displayed in UI

## Performance Considerations

1. **Database Indexing**
   - Index on `user_id` for fast account lookups
   - Index on `(user_id, account)` for filtered queries
   - Index on `current_balance DESC` for leaderboard queries

2. **Caching**
   - Cache market prices (reuse existing market data cache)
   - Cache leaderboard for 5 minutes
   - Cache user's account summary for 30 seconds

3. **Query Optimization**
   - Use pagination for transaction history
   - Limit leaderboard to top 100 users
   - Use database views for complex performance calculations

4. **Real-time Updates**
   - WebSocket connection for live price updates
   - Debounce portfolio value recalculations
   - Batch update holdings prices

## Deployment Considerations

1. **Database Migration**: Run migration to create paper_accounts and paper_account_resets tables
2. **Feature Flag**: Optional feature flag to enable/disable leaderboard
3. **Monitoring**: Track paper trading usage, order volume, reset frequency
4. **Analytics**: Monitor user engagement with educational features
5. **Rollback Plan**: Feature can be disabled without affecting real trading

## Future Enhancements

1. **Advanced Order Types**: Limit orders, stop-loss orders
2. **Social Features**: Share trades, follow other paper traders
3. **Challenges**: Time-limited trading competitions
4. **AI Insights**: Personalized trading suggestions based on paper trading history
5. **Mobile App**: Native mobile experience for paper trading
6. **Backtesting**: Test strategies against historical data
7. **Risk Metrics**: Value at Risk (VaR), beta, alpha calculations
