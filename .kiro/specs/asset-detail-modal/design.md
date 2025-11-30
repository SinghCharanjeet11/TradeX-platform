# Asset Detail Modal - Design Document

## Overview

The Asset Detail Modal is a comprehensive information overlay that provides traders with detailed asset analysis, historical price data, market statistics, and AI-powered trading recommendations. The feature integrates with existing market data providers and introduces a new AI suggestion engine to deliver actionable insights.

The modal is triggered by clicking any asset name in the market tables across the platform (Dashboard, Markets page). It fetches real-time data from the backend, displays interactive charts with multiple timeframes, and provides AI-generated trading suggestions based on technical analysis and market sentiment.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  AssetDetailModal Component                                  │
│    ├─ Modal Container (overlay, animations)                  │
│    ├─ Asset Header (name, symbol, price, change)            │
│    ├─ Chart Section (timeframe selector, chart display)     │
│    ├─ Statistics Section (market stats grid)                │
│    └─ AI Suggestion Section (button, results display)       │
│                                                              │
│  useAssetDetail Hook (state management, data fetching)      │
│  assetService (API client for asset details)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Asset Routes (/api/assets/:symbol/details)                 │
│              (/api/assets/:symbol/chart)                    │
│              (/api/assets/:symbol/ai-suggestion)            │
│                                                              │
│  Asset Controller (request handling, validation)            │
│                                                              │
│  Asset Service (business logic orchestration)               │
│    ├─ Market Data Aggregation                               │
│    ├─ Chart Data Processing                                 │
│    └─ AI Suggestion Coordination                            │
│                                                              │
│  AI Suggestion Engine                                        │
│    ├─ Technical Analysis Module                             │
│    ├─ Sentiment Analysis Module                             │
│    └─ Prediction Generator                                  │
│                                                              │
│  Market Providers (CryptoProvider, StocksProvider, etc.)    │
│  Cache Service (TTL-based caching)                          │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **User clicks asset name** → Triggers modal open with asset symbol
2. **Modal opens** → Fetches asset details, chart data (default 24h), and market stats
3. **User selects timeframe** → Fetches new chart data for selected period
4. **User clicks AI Suggestion** → Calls AI engine, displays analysis results
5. **User closes modal** → Cleans up state, re-enables background scrolling

## Components and Interfaces

### Frontend Components

#### AssetDetailModal Component

```typescript
interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetSymbol: string;
  assetType: 'crypto' | 'stock' | 'forex' | 'commodity';
}

interface AssetDetailData {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply?: number;
  totalSupply?: number;
  high24h: number;
  low24h: number;
  allTimeHigh?: number;
  allTimeHighDate?: string;
}

interface ChartData {
  timestamp: number;
  price: number;
  volume?: number;
}

interface AIsuggestion {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: number; // 0-100
  recommendation: 'Buy' | 'Hold' | 'Sell';
  reasoning: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  keyFactors: string[];
  shortTermPrediction: string; // 24h
  mediumTermPrediction: string; // 7d
  disclaimer: string;
}
```

**Responsibilities:**
- Render modal overlay with backdrop
- Display asset header with real-time price information
- Manage timeframe selection state
- Render interactive price chart using Chart.js or Recharts
- Display market statistics in organized grid layout
- Handle AI suggestion button click and display results
- Manage loading and error states
- Handle modal close and cleanup

#### useAssetDetail Hook

```typescript
function useAssetDetail(symbol: string, assetType: string) {
  return {
    assetData: AssetDetailData | null;
    chartData: ChartData[];
    aiSuggestion: AISuggestion | null;
    selectedTimeframe: string;
    isLoading: boolean;
    isLoadingChart: boolean;
    isLoadingAI: boolean;
    error: string | null;
    fetchAssetDetails: () => Promise<void>;
    fetchChartData: (timeframe: string) => Promise<void>;
    fetchAISuggestion: () => Promise<void>;
    setTimeframe: (timeframe: string) => void;
  };
}
```

**Responsibilities:**
- Manage all modal state (data, loading, errors)
- Fetch asset details on mount
- Fetch chart data when timeframe changes
- Fetch AI suggestions on demand
- Handle error states and retries
- Cache AI suggestions to avoid redundant calls

### Backend Components

#### Asset Controller

```javascript
class AssetController {
  async getAssetDetails(req, res) {
    // GET /api/assets/:symbol/details?type=crypto
    // Returns comprehensive asset information
  }
  
  async getAssetChart(req, res) {
    // GET /api/assets/:symbol/chart?type=crypto&timeframe=24h
    // Returns historical price data for charting
  }
  
  async getAISuggestion(req, res) {
    // POST /api/assets/:symbol/ai-suggestion
    // Body: { type: 'crypto', currentData: {...} }
    // Returns AI-generated trading suggestion
  }
}
```

#### Asset Service

```javascript
class AssetService {
  async getAssetDetails(symbol, type) {
    // Orchestrates data fetching from appropriate provider
    // Aggregates market statistics
    // Returns formatted asset detail object
  }
  
  async getChartData(symbol, type, timeframe) {
    // Fetches historical data from provider
    // Transforms to chart-friendly format
    // Returns array of price/volume data points
  }
  
  async generateAISuggestion(symbol, type, currentData) {
    // Coordinates with AI Suggestion Engine
    // Passes market data and technical indicators
    // Returns AI analysis and recommendations
  }
}
```

#### AI Suggestion Engine

```javascript
class AISuggestionEngine {
  async analyze(assetData, chartData, technicalIndicators) {
    // Performs technical analysis
    // Calculates sentiment score
    // Generates prediction and recommendation
    // Returns structured AI suggestion object
  }
  
  calculateTechnicalIndicators(chartData) {
    // Calculates RSI (Relative Strength Index)
    // Calculates MACD (Moving Average Convergence Divergence)
    // Calculates Moving Averages (SMA, EMA)
    // Returns indicator values
  }
  
  analyzeSentiment(priceData, volumeData, indicators) {
    // Analyzes price momentum
    // Evaluates volume trends
    // Considers technical indicator signals
    // Returns sentiment (Bullish/Bearish/Neutral)
  }
  
  generateRecommendation(sentiment, confidence, riskFactors) {
    // Determines Buy/Hold/Sell recommendation
    // Generates reasoning explanation
    // Assesses risk level
    // Returns recommendation object
  }
}
```

## Data Models

### Asset Detail Model

```javascript
{
  symbol: 'BTC',
  name: 'Bitcoin',
  type: 'crypto',
  currentPrice: 45000.00,
  priceChange24h: 1250.50,
  priceChangePercent24h: 2.86,
  marketCap: 850000000000,
  volume24h: 35000000000,
  circulatingSupply: 19500000,
  totalSupply: 21000000,
  high24h: 45500.00,
  low24h: 43200.00,
  allTimeHigh: 69000.00,
  allTimeHighDate: '2021-11-10',
  lastUpdated: '2025-11-24T10:30:00Z'
}
```

### Chart Data Model

```javascript
{
  timeframe: '24h',
  data: [
    {
      timestamp: 1700820000000,
      price: 44500.00,
      volume: 1250000000
    },
    // ... more data points
  ]
}
```

### AI Suggestion Model

```javascript
{
  sentiment: 'Bullish',
  confidence: 78,
  recommendation: 'Buy',
  reasoning: 'Strong upward momentum with increasing volume. RSI indicates asset is not overbought. MACD shows bullish crossover.',
  riskLevel: 'Medium',
  keyFactors: [
    'Positive price momentum (+2.86% in 24h)',
    'Volume increase of 15% above average',
    'RSI at 62 (healthy range)',
    'MACD bullish crossover detected'
  ],
  shortTermPrediction: 'Expected to test $46,000 resistance within 24 hours',
  mediumTermPrediction: 'Potential to reach $48,000-$50,000 range within 7 days if momentum continues',
  disclaimer: 'This analysis is for informational purposes only and should not be considered financial advice. Always conduct your own research and consult with financial advisors before making investment decisions.',
  generatedAt: '2025-11-24T10:30:00Z'
}
```

### Technical Indicators Model

```javascript
{
  rsi: 62.5,
  macd: {
    value: 125.50,
    signal: 110.30,
    histogram: 15.20
  },
  movingAverages: {
    sma20: 44200.00,
    sma50: 43500.00,
    ema12: 44800.00,
    ema26: 44100.00
  },
  volumeAverage: 30000000000,
  priceVolatility: 0.045
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Asset information display completeness
*For any* asset data object, when rendered in the modal, the displayed content should include the asset's name, symbol, current price, and 24-hour change.
**Validates: Requirements 1.2**

### Property 2: Background scroll prevention
*For any* modal state, when the modal is open (isOpen === true), the document body should have scroll prevention applied (overflow: hidden or equivalent).
**Validates: Requirements 1.4**

### Property 3: Timeframe selection triggers data fetch
*For any* valid timeframe selection ('1h', '24h', '7d', '30d', '1y'), selecting that timeframe should trigger a chart data fetch request with the corresponding timeframe parameter.
**Validates: Requirements 2.3**

### Property 4: Price direction color coding
*For any* price change value, if the change is positive, the color should be green; if negative, the color should be red; if zero, the color should be neutral.
**Validates: Requirements 2.5**

### Property 5: Market cap formatting consistency
*For any* market capitalization value, the displayed format should include proper number formatting (commas, decimal places, and abbreviations like K, M, B, T for thousands, millions, billions, trillions).
**Validates: Requirements 3.1**

### Property 6: Volume data display
*For any* asset with volume data, the 24-hour trading volume should be present in the rendered statistics section.
**Validates: Requirements 3.2**

### Property 7: Conditional supply display
*For any* asset, if circulating supply and total supply data exist, they should be displayed; if they don't exist, the modal should render without errors.
**Validates: Requirements 3.3**

### Property 8: High and low price display
*For any* asset with 24-hour high and low data, both values should be present in the rendered statistics section.
**Validates: Requirements 3.4**

### Property 9: Conditional ATH display
*For any* asset, if all-time high data exists, it should be displayed with the date; if it doesn't exist, the modal should render without errors.
**Validates: Requirements 3.5**

### Property 10: AI sentiment validity
*For any* AI suggestion response, the sentiment field must be one of the three valid values: 'Bullish', 'Bearish', or 'Neutral'.
**Validates: Requirements 4.3**

### Property 11: AI confidence score presence
*For any* AI suggestion response, the confidence score must be present and be a number between 0 and 100.
**Validates: Requirements 4.4**

### Property 12: AI recommendation validity
*For any* AI suggestion response, the recommendation field must be one of the three valid values: 'Buy', 'Hold', or 'Sell'.
**Validates: Requirements 4.5**

### Property 13: AI reasoning presence
*For any* AI suggestion response, the reasoning field must be present and contain non-empty text.
**Validates: Requirements 4.6**

### Property 14: AI risk and factors structure
*For any* AI suggestion response, the riskLevel field must be one of 'Low', 'Medium', or 'High', and keyFactors must be an array with at least one element.
**Validates: Requirements 4.7**

### Property 15: Technical indicators calculation
*For any* valid chart data array with sufficient data points, the technical indicator calculations (RSI, MACD, Moving Averages) should produce numeric values within expected ranges (RSI: 0-100, MACD: any number, MA: positive numbers).
**Validates: Requirements 5.2**

### Property 16: AI prediction completeness
*For any* AI suggestion response, both shortTermPrediction and mediumTermPrediction fields must be present and contain non-empty text.
**Validates: Requirements 5.4**

### Property 17: AI disclaimer presence
*For any* AI suggestion response, the disclaimer field must be present and contain text warning about investment risks.
**Validates: Requirements 5.5**

## Error Handling

### Frontend Error Handling

1. **Network Errors**
   - Display user-friendly error messages when API calls fail
   - Provide retry buttons for failed data fetches
   - Maintain modal functionality even when some data fails to load
   - Show loading skeletons during data fetching

2. **Invalid Asset Data**
   - Handle missing or null values gracefully
   - Display "N/A" or appropriate placeholders for unavailable data
   - Validate asset symbol before making API calls
   - Show error message if asset not found

3. **Chart Rendering Errors**
   - Catch chart library errors and display fallback message
   - Handle empty or insufficient chart data
   - Provide error boundary for chart component
   - Show "No data available" message when appropriate

4. **AI Service Errors**
   - Display fallback message when AI service is unavailable
   - Handle timeout errors (30-second timeout)
   - Show "AI analysis unavailable" without breaking modal
   - Provide option to retry AI suggestion

### Backend Error Handling

1. **Provider Failures**
   - Implement retry logic with exponential backoff (3 attempts)
   - Fall back to cached data when provider is unavailable
   - Return partial data if some providers fail
   - Log all provider errors for monitoring

2. **Invalid Requests**
   - Validate asset symbol format and type
   - Return 400 Bad Request for invalid parameters
   - Validate timeframe parameter against allowed values
   - Sanitize all user inputs

3. **AI Engine Errors**
   - Handle insufficient data for technical analysis
   - Return error response when AI analysis fails
   - Implement timeout for AI processing (30 seconds)
   - Log AI engine errors for debugging

4. **Rate Limiting**
   - Implement rate limiting for AI suggestion endpoint (10 requests per minute per user)
   - Return 429 Too Many Requests when limit exceeded
   - Include retry-after header in rate limit responses

## Testing Strategy

### Unit Testing

**Frontend Unit Tests:**
- Test AssetDetailModal component rendering with various props
- Test modal open/close functionality
- Test timeframe selection state management
- Test error state rendering
- Test loading state rendering
- Test data formatting functions (price, market cap, percentages)
- Test color coding logic for price changes
- Test conditional rendering of optional fields (supply, ATH)

**Backend Unit Tests:**
- Test AssetController request validation
- Test AssetService data aggregation logic
- Test chart data transformation functions
- Test technical indicator calculations (RSI, MACD, MA)
- Test AI engine sentiment analysis logic
- Test AI engine recommendation generation
- Test error handling for missing data
- Test cache integration

### Property-Based Testing

The following properties will be tested using a property-based testing library (fast-check for JavaScript/TypeScript):

**Property 1: Asset information display completeness**
- Generate random asset data objects
- Verify all required fields are present in rendered output
- Validates Requirements 1.2

**Property 2: Timeframe selection triggers data fetch**
- Generate random timeframe selections
- Verify correct API call is made for each timeframe
- Validates Requirements 2.3

**Property 3: Price direction color coding**
- Generate random price change values (positive, negative, zero)
- Verify correct color is applied for each case
- Validates Requirements 2.5

**Property 4: Market cap formatting consistency**
- Generate random market cap values (small to very large)
- Verify formatting is consistent and readable
- Validates Requirements 3.1

**Property 5: AI sentiment validity**
- Generate random AI suggestion responses
- Verify sentiment is always one of the three valid values
- Validates Requirements 4.3

**Property 6: AI recommendation validity**
- Generate random AI suggestion responses
- Verify recommendation is always one of the three valid values
- Validates Requirements 4.5

**Property 7: Technical indicators calculation**
- Generate random valid chart data arrays
- Verify indicator calculations produce values in expected ranges
- Validates Requirements 5.2

**Property 8: AI response completeness**
- Generate random AI suggestion responses
- Verify all required fields are present and properly structured
- Validates Requirements 4.4, 4.6, 4.7, 5.4, 5.5

### Integration Testing

- Test complete flow: click asset → modal opens → data loads → chart displays
- Test timeframe switching with real API calls
- Test AI suggestion generation with real market data
- Test error recovery when API fails
- Test modal close and cleanup
- Test multiple modal open/close cycles
- Test with different asset types (crypto, stock, forex, commodity)

### End-to-End Testing

- Test user journey: browse markets → click asset → view details → get AI suggestion → close modal
- Test on different screen sizes (mobile, tablet, desktop)
- Test with slow network conditions
- Test with API failures and recovery
- Test accessibility (keyboard navigation, screen readers)

## Performance Considerations

1. **Data Caching**
   - Cache asset details for 30 seconds
   - Cache chart data for 60 seconds per timeframe
   - Cache AI suggestions for 5 minutes per asset
   - Use browser localStorage for client-side caching

2. **Lazy Loading**
   - Load chart library only when modal opens
   - Defer AI suggestion fetch until button is clicked
   - Load chart data on-demand per timeframe

3. **Optimization**
   - Debounce rapid timeframe changes
   - Cancel pending requests when modal closes
   - Use React.memo for chart component
   - Implement virtual scrolling for large datasets (if needed)

4. **Bundle Size**
   - Use lightweight chart library (Chart.js or Recharts)
   - Code-split modal component
   - Lazy load AI suggestion UI components

## Security Considerations

1. **Input Validation**
   - Validate asset symbol format (alphanumeric, max 10 chars)
   - Validate asset type against allowed values
   - Validate timeframe parameter against whitelist
   - Sanitize all user inputs to prevent XSS

2. **Rate Limiting**
   - Limit AI suggestion requests to prevent abuse
   - Implement per-user rate limits on all endpoints
   - Track and log excessive requests

3. **Authentication**
   - Require valid session token for all API calls
   - Verify user permissions before returning data
   - Implement CSRF protection

4. **Data Privacy**
   - Don't log sensitive user data
   - Anonymize AI suggestion requests in logs
   - Comply with data retention policies

## Accessibility

1. **Keyboard Navigation**
   - Modal can be closed with Escape key
   - All interactive elements are keyboard accessible
   - Proper tab order throughout modal
   - Focus trap within modal when open

2. **Screen Reader Support**
   - ARIA labels for all buttons and controls
   - ARIA live regions for dynamic content updates
   - Semantic HTML structure
   - Alt text for icons and visual indicators

3. **Visual Accessibility**
   - Sufficient color contrast (WCAG AA compliance)
   - Don't rely solely on color for information
   - Scalable text (respects user font size preferences)
   - Clear focus indicators

## Future Enhancements

1. **Advanced Charting**
   - Add technical indicator overlays on chart
   - Support for multiple chart types (candlestick, line, area)
   - Drawing tools for trend lines and annotations
   - Compare multiple assets on same chart

2. **Enhanced AI Features**
   - Real-time news sentiment integration
   - Social media sentiment analysis
   - Historical prediction accuracy tracking
   - Personalized recommendations based on user portfolio

3. **Additional Data**
   - Order book depth visualization
   - Recent trades list
   - Correlation with other assets
   - On-chain metrics for cryptocurrencies

4. **User Preferences**
   - Save favorite timeframe per user
   - Customizable modal layout
   - Dark/light theme support
   - Currency preference for price display
