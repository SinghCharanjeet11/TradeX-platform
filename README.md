# TradeX - Trading Platform

A full-stack trading platform with real-time market data, authentication, and interactive dashboard.

## Features

### Authentication
- User Registration with validation
- User Sign In with "Remember Me"
- Password Reset Flow
- Real-time form validation
- Secure password hashing (bcrypt)
- JWT-based session management
- Rate limiting
- CSRF protection

### Market Data
- Real-time cryptocurrency prices (CoinGecko API)
- Real-time stock quotes (Alpha Vantage API)
- Forex exchange rates
- Commodity prices
- Auto-refresh every 30 seconds
- Smart caching to minimize API calls
- Graceful error handling with fallbacks

### Dashboard
- Interactive market data tables
- Multiple market views (Crypto, Stocks, Forex, Commodities)
- Price charts and visualizations
- Responsive design

## Tech Stack

**Frontend:**
- React 18
- React Router
- Vite
- CSS Modules

**Backend:**
- Node.js
- Express
- PostgreSQL
- bcrypt
- JWT
- Nodemailer
- Axios (API integration)
- CoinGecko API (Crypto data)
- Alpha Vantage API (Stocks, Forex, Commodities)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
   - Copy `server/.env.example` to `server/.env`
   - Update the values in the `.env` file

4. **Get API Keys (Required for Market Data):**

   **Alpha Vantage API Key (Free):**
   - Visit: https://www.alphavantage.co/support/#api-key
   - Fill out the form with your email
   - Copy the API key you receive
   - Add it to `server/.env`:
     ```
     ALPHA_VANTAGE_API_KEY=your_api_key_here
     ```
   
   **CoinGecko API:**
   - No API key required! CoinGecko API is free and public
   - Crypto data will work immediately

5. Set up the database:
```bash
cd server
npm run db:setup
```

### Development

Run both client and server concurrently:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Frontend (http://localhost:3000)
npm run dev:client

# Terminal 2 - Backend (http://localhost:5000)
npm run dev:server
```

### Build for Production

```bash
npm run build
```

## Project Structure

```
tradex-authentication/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── App.jsx
│   └── package.json
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── server.js
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Sign in user
- `POST /api/auth/logout` - Sign out user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user

### Market Data
- `GET /api/markets/crypto` - Get cryptocurrency market data
- `GET /api/markets/stocks` - Get stock market data
- `GET /api/markets/forex` - Get forex exchange rates
- `GET /api/markets/commodities` - Get commodity prices
- `GET /api/markets/:type/:symbol/chart?days=7` - Get chart data
- `GET /api/markets/health` - Check API health status

## Market Data Configuration

### API Rate Limits

**CoinGecko (Free Tier):**
- 10-50 calls/minute 
- No API key required
- Used for cryptocurrency data

**Alpha Vantage (Free Tier):**
- 25 API calls per day
- 5 API calls per minute
- Used for stocks, forex, and commodities

### Caching Strategy

To minimize API calls and stay within rate limits, the system implements smart caching:

- **Crypto:** 30 seconds cache (high volatility)
- **Stocks:** 60 seconds cache
- **Forex:** 60 seconds cache
- **Commodities:** 120 seconds cache
- **Charts:** 5 minutes cache

### Troubleshooting

**"Alpha Vantage API key not configured" error:**
- Make sure you've added your API key to `server/.env`
- Restart the server after adding the key

**Rate limit exceeded:**
- The system will automatically serve cached data
- Wait for the rate limit to reset (1 minute for Alpha Vantage)
- Consider upgrading to a paid API tier for higher limits

**Crypto data works but stocks/forex/commodities don't:**
- Check that your Alpha Vantage API key is valid
- Visit `/api/markets/health` to check API status

## License

MIT
