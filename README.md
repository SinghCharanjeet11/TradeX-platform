# TradeX — AI-Powered Trading Platform

**TradeX** is a full-stack trading platform built for the **Frostbyte Hackathon Grand Finale 2026**. It aggregates real-time market data across cryptocurrencies, stocks, forex, and commodities — and layers on AI-powered trading signals powered by **Google Gemini Flash**.

> **Live Demo:** [https://tradex-platform.onrender.com](https://tradex-platform.onrender.com)  
> **Demo Video:** [Watch on YouTube](#)

---

## What It Does

TradeX gives retail traders a professional-grade dashboard without the complexity of traditional platforms:

- **Real-time market data** across crypto, stocks, forex, and commodities
- **AI trading signals** with BUY/SELL/HOLD recommendations, confidence scores, price targets, and explainability — powered by Gemini Flash
- **Paper trading** — practice with $100,000 virtual balance before risking real money
- **Portfolio management** — track holdings, performance, and P&L
- **Financial news** aggregated from live sources
- **Watchlist** with custom asset tracking
- **Two-factor authentication** and enterprise-grade security

---

## AI Trading Signals

The signal engine combines rule-based technical analysis with **Google Gemini Flash 1.5** for contextual reasoning:

- Calculates RSI, MACD, Bollinger Bands, EMA, SMA, and volatility
- Sends indicators to Gemini with a structured prompt
- Returns: signal type, confidence (60–85%), market condition, risk level, reasoning
- Shows **why** the signal was generated, **why not BUY**, **why not SELL** — full explainability
- Falls back to rule-based analysis if Gemini is unavailable

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 + Vite | UI framework & build |
| React Router 6 | Client-side routing |
| Recharts | Charts & data visualization |
| Framer Motion | Page transitions & animations |
| CSS Modules | Scoped styling |
| Axios | HTTP client with retry logic |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | API server |
| PostgreSQL | Primary database |
| JWT | Session tokens (7-day expiry) |
| bcrypt | Password hashing |
| Speakeasy | TOTP two-factor authentication |
| Resend | Transactional email (password reset) |
| Helmet + CORS | Security headers |
| express-rate-limit | Rate limiting & brute-force protection |

### AI & External APIs
| Service | Used For |
|---------|---------|
| Google Gemini Flash 1.5 | AI trading signal generation |
| CoinGecko | Cryptocurrency market data |
| Alpha Vantage | Stocks, forex, commodities |
| CoinGecko Trending | Financial news fallback |
| Resend | Password reset emails |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Render Static Site | Frontend hosting |
| Render Web Service | Backend hosting |
| Supabase | Managed PostgreSQL |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  React Frontend (Vite)                   │
│  Dashboard · Markets · Portfolio · Paper Trading · News  │
│  Auth Context + localStorage token (7-day sessions)      │
└──────────────────────────┬──────────────────────────────┘
                           │  HTTPS + Bearer Token
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js / Express Backend                   │
│  Auth · CSRF · Rate Limiting · Session Management        │
├──────────────────────────────────────────────────────────┤
│  Routes → Controllers → Services → Repositories          │
├──────────────────────────────────────────────────────────┤
│  Gemini Flash ← Signal Generator ← Technical Indicators  │
└──────┬───────────────────┬──────────────────────────────┘
       ▼                   ▼
  PostgreSQL          External APIs
  (Supabase)          CoinGecko · Alpha Vantage
```

**Key design decisions:**
- Bearer token in `Authorization` header instead of cookies — solves cross-domain session loss on Render
- In-memory cache with TTL per data type — prevents API rate limit exhaustion
- Gemini Flash as primary signal source, rule-based engine as fallback — never shows empty signals
- Keep-alive ping every 10 minutes — prevents Render free tier cold starts

---

## Features

### Authentication & Security
- Register / sign in with email + password
- **Two-factor authentication (2FA)** — TOTP via authenticator app + backup codes
- **Password reset via email** — tokenized link, expires in 1 hour
- 7-day persistent sessions (survives page refresh)
- Rate limiting, CSRF protection, bcrypt hashing, session invalidation on password change

### Markets
- Live prices for crypto, stocks, forex, and commodities
- Interactive price charts (1D, 1W, 1M, 3M, 1Y)
- Fear & Greed Index, top gainers/losers

### AI Insights
- Per-asset trading signals with full explainability
- Confidence bar, risk level, price targets (entry / target / stop-loss)
- Beginner-friendly plain-English explanation alongside technical analysis
- "AI Powered" badge when Gemini enhanced the signal

### Paper Trading
- $100,000 virtual balance
- Market order execution at live prices
- Real-time P&L, position tracking, transaction history
- Account reset anytime

### Portfolio & Watchlist
- Holdings with real-time valuations
- Asset allocation and performance charts
- Watchlist for quick price tracking

### News
- Aggregated financial news
- Category filtering (Crypto, Stocks, Economy)
- Live trending from CoinGecko when news APIs are unavailable

---

## Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or Supabase account)

### Setup

```bash
# Clone
git clone https://github.com/SinghCharanjeet11/TradeX-platform.git
cd TradeX-platform

# Install all dependencies
npm run install:all
```

### Environment Variables

Create `server/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Auth
JWT_SECRET=your-secret-here
ENCRYPTION_KEY=your-32-char-key

# Frontend URL (for password reset emails)
FRONTEND_URL=http://localhost:3000

# APIs
ALPHA_VANTAGE_API_KEY=your-key
GEMINI_API_KEY=your-gemini-key
RESEND_API_KEY=your-resend-key
```

### Run

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Database Init

```bash
cd server && npm run db:init
```

---

## Project Structure

```
TradeX-platform/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # UI components (charts, modals, layout)
│   │   ├── pages/           # Route-level pages
│   │   ├── contexts/        # AuthContext, ThemeContext
│   │   ├── hooks/           # Custom hooks (market data, insights)
│   │   └── services/        # Axios API client
│   └── public/
│       └── _redirects       # SPA routing fix for Render
└── server/                  # Node.js + Express backend
    ├── controllers/          # Request handlers
    ├── services/             # Business logic (Gemini, signals, email)
    ├── repositories/         # Database queries
    ├── middleware/           # Auth, CSRF, rate limiting
    ├── routes/               # API route definitions
    └── database/            # Migrations & schema
```

---

## API Endpoints

```
POST  /api/auth/register           Register
POST  /api/auth/login              Login (returns JWT)
POST  /api/auth/forgot-password    Send reset email
POST  /api/auth/reset-password     Reset with token
GET   /api/auth/me                 Current user (Bearer token)

GET   /api/markets/crypto          Live crypto prices
GET   /api/markets/stocks          Live stock prices
GET   /api/markets/:type/:symbol/chart   Price history

GET   /api/insights/signals/:symbol     AI trading signals
GET   /api/insights/technical/:symbol   Technical indicators

GET   /api/portfolio/summary       Portfolio overview
GET   /api/holdings                User holdings

POST  /api/paper-trading/trade     Execute paper trade
GET   /api/paper-trading/account   Virtual account balance

GET   /api/news                    Financial news feed
GET   /api/watchlist               User watchlist

GET   /health                      Server health check
```

---

## Built For

**Frostbyte Hackathon Grand Finale 2026**

---

## Author

**Charanjeet Singh**  
GitHub: [@SinghCharanjeet11](https://github.com/SinghCharanjeet11)
