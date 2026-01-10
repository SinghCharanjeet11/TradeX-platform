# 🚀 TradeX — Production-Grade Trading Platform

**TradeX** is a full-stack, production-ready trading platform that aggregates real-time market data across **cryptocurrencies, stocks, forex, and commodities**. It features AI-powered insights, paper trading simulation, portfolio management, and enterprise-grade security.

> **Live Demo:** [https://tradex-platform.onrender.com](https://tradex-platform.onrender.com)

This project demonstrates industry-level system design, secure authentication patterns, and scalable API architecture under real-world constraints.

---

## 🧠 System Design Highlights

### Key Engineering Principles
- **Layered Architecture**: Routes → Controllers → Services → Repositories → Database
- **Stateless Authentication**: JWT with refresh tokens and session management
- **API-Aware Caching**: Intelligent TTL strategy to handle third-party rate limits
- **Graceful Degradation**: Fallback logic when external services fail
- **Security-First Design**: 2FA, rate limiting, CSRF protection, audit logging

---

## ✨ Core Features

### 🔐 Authentication & Security
- Secure registration/login with bcrypt password hashing
- JWT access tokens + HTTP-only refresh cookies
- **Two-Factor Authentication (2FA)** with TOTP & backup codes
- Session management with device fingerprinting
- Password reset via tokenized email flow
- Rate limiting & IP blocking
- CSRF protection
- Audit logging for security events

### 📊 Multi-Market Data Aggregation
| Market | Provider | Cache TTL |
|--------|----------|-----------|
| Crypto | CoinGecko | 30 sec |
| Stocks | Alpha Vantage | 60 sec |
| Forex | Alpha Vantage | 60 sec |
| Commodities | Alpha Vantage | 120 sec |
| News | NewsAPI | 5 min |

### 🤖 AI-Powered Insights
- **Technical Indicators**: RSI, MACD, Bollinger Bands, Moving Averages
- **Trading Signals**: Buy/Sell/Hold recommendations with confidence scores
- **Sentiment Analysis**: Market sentiment from news and social data
- **Price Predictions**: ML-based price forecasting
- **Portfolio Optimization**: Risk-adjusted allocation suggestions

### 📈 Paper Trading Engine
- Virtual $100,000 starting balance
- Real-time market order execution
- Position tracking with P&L calculations
- Transaction history
- Account reset functionality
- Performance analytics

### 💼 Portfolio Management
- Holdings tracking with real-time valuations
- Asset allocation visualization
- Performance charts (1D, 1W, 1M, 3M, 1Y)
- Watchlist with price alerts
- Portfolio snapshots for historical tracking

### 📰 Financial News
- Real-time news aggregation
- Category filtering (Crypto, Stocks, Economy)
- Article bookmarking
- Breaking news section
- Search functionality

### 🖥️ Interactive Dashboard
- Multi-market overview
- Fear & Greed Index
- Top gainers/losers
- Portfolio summary cards
- Price alert notifications
- Responsive design (desktop & mobile)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React + Vite)                     │
├─────────────────────────────────────────────────────────────┤
│  Pages: Dashboard | Markets | Portfolio | Paper Trading     │
│         News | Settings | Auth                              │
│  State: Context API | Custom Hooks | Cache Layer            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend (Node.js + Express)                  │
├─────────────────────────────────────────────────────────────┤
│  Middleware: Auth | CORS | Rate Limit | CSRF | Validation   │
├─────────────────────────────────────────────────────────────┤
│  Routes → Controllers → Services → Repositories             │
├─────────────────────────────────────────────────────────────┤
│  Services: Market | Portfolio | Paper Trading | AI Insights │
│            News | Auth | 2FA | Sessions | Alerts            │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│   PostgreSQL     │ │  External    │ │   Cache Layer    │
│   (Supabase)     │ │  APIs        │ │   (In-Memory)    │
│                  │ │              │ │                  │
│  • Users         │ │  • CoinGecko │ │  • Market Data   │
│  • Sessions      │ │  • Alpha     │ │  • API Responses │
│  • Holdings      │ │    Vantage   │ │  • News Articles │
│  • Paper Trades  │ │  • NewsAPI   │ │                  │
│  • Watchlists    │ │              │ │                  │
│  • AI Insights   │ │              │ │                  │
└──────────────────┘ └──────────────┘ └──────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build Tool |
| React Router 6 | Navigation |
| Recharts | Data Visualization |
| Framer Motion | Animations |
| Formik + Yup | Form Handling |
| CSS Modules | Styling |
| Axios | HTTP Client |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express | Web Framework |
| PostgreSQL | Database |
| JWT | Authentication |
| bcrypt | Password Hashing |
| Speakeasy | 2FA/TOTP |
| Nodemailer | Email Service |
| Helmet | Security Headers |
| express-rate-limit | Rate Limiting |
| Sentiment | NLP Analysis |

### External APIs
| API | Data |
|-----|------|
| CoinGecko | Cryptocurrency prices |
| Alpha Vantage | Stocks, Forex, Commodities |
| NewsAPI | Financial news |
| Binance | Real-time crypto data |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Render | Backend hosting |
| Render Static | Frontend hosting |
| Supabase | PostgreSQL database |
| GitHub Actions | CI/CD (optional) |

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
POST   /api/auth/forgot-password   # Request password reset
POST   /api/auth/reset-password    # Reset password
GET    /api/auth/me                # Get current user
POST   /api/auth/2fa/setup         # Setup 2FA
POST   /api/auth/2fa/verify        # Verify 2FA code
```

### Markets
```
GET    /api/markets/crypto         # Cryptocurrency prices
GET    /api/markets/stocks         # Stock prices
GET    /api/markets/forex          # Forex rates
GET    /api/markets/commodities    # Commodity prices
GET    /api/markets/:type/:symbol/chart  # Price history
GET    /api/markets/health         # API health check
```

### Portfolio & Holdings
```
GET    /api/portfolio/summary      # Portfolio overview
GET    /api/portfolio/performance  # Performance metrics
GET    /api/holdings               # User holdings
POST   /api/holdings               # Add holding
PUT    /api/holdings/:id           # Update holding
DELETE /api/holdings/:id           # Remove holding
```

### Paper Trading
```
GET    /api/paper-trading/account  # Get paper account
POST   /api/paper-trading/trade    # Execute paper trade
GET    /api/paper-trading/positions # Get positions
GET    /api/paper-trading/history  # Transaction history
POST   /api/paper-trading/reset    # Reset account
```

### AI Insights
```
GET    /api/insights/technical/:symbol    # Technical indicators
GET    /api/insights/signals/:symbol      # Trading signals
GET    /api/insights/sentiment/:symbol    # Sentiment analysis
GET    /api/insights/prediction/:symbol   # Price prediction
GET    /api/insights/recommendations      # Portfolio recommendations
```

### Watchlist & Alerts
```
GET    /api/watchlist              # Get watchlist
POST   /api/watchlist              # Add to watchlist
DELETE /api/watchlist/:symbol      # Remove from watchlist
POST   /api/watchlist/alerts       # Create price alert
```

### News
```
GET    /api/news                   # Get news articles
GET    /api/news/breaking          # Breaking news
POST   /api/news/bookmark/:id      # Bookmark article
GET    /api/news/bookmarks         # Get bookmarks
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or Supabase account)
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/SinghCharanjeet11/TradeX-platform.git
cd TradeX-platform

# Install all dependencies
npm run install:all
```

### Environment Variables

```bash
# Server (.env)
cp server/.env.example server/.env
```

Required variables:
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
ENCRYPTION_KEY=your-32-char-encryption-key

# External APIs
ALPHA_VANTAGE_API_KEY=your-api-key
NEWS_API_KEY=your-news-api-key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email
SMTP_PASS=your-app-password
```

### Database Setup

```bash
cd server
npm run db:init
```

### Run Locally

```bash
# From root directory
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## 📈 Performance & Reliability

- **Smart Caching**: Prevents API exhaustion with intelligent TTL
- **Stateless Backend**: Horizontally scalable architecture
- **Connection Pooling**: Efficient database connections via Supabase
- **Graceful Degradation**: Fallback data when APIs fail
- **Health Endpoints**: `/health` for monitoring
- **Scheduled Jobs**: Automatic session cleanup

---

## 🧪 Testing

```bash
cd server
npm test
```

Includes:
- Unit tests for services
- Property-based tests with fast-check
- Integration tests for API endpoints

---

## 📁 Project Structure

```
TradeX-platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── services/       # API services
│   └── public/
├── server/                 # Node.js backend
│   ├── config/             # Configuration
│   ├── controllers/        # Request handlers
│   ├── database/           # Migrations & init
│   ├── middleware/         # Express middleware
│   ├── providers/          # External API clients
│   ├── repositories/       # Data access layer
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── utils/              # Utilities
└── scripts/                # Deployment scripts
```

---

## 🧑‍💻 Why This Project Matters

TradeX demonstrates:

✅ **Real-world backend constraints** — Rate limiting, caching, API quotas  
✅ **Enterprise security patterns** — 2FA, session management, audit logs  
✅ **Clean layered architecture** — Separation of concerns at every level  
✅ **AI/ML integration** — Technical analysis, sentiment, predictions  
✅ **Full-stack proficiency** — React + Node.js + PostgreSQL  
✅ **Production deployment** — Render + Supabase infrastructure  

This project is suitable as:
- 🎯 A portfolio centerpiece for engineering roles
- 💬 A system design discussion artifact
- 🏗️ A foundation for a real trading application

---

## 📄 License

MIT

---

## 👤 Author

**Charanjeet Singh**  
GitHub: [@SinghCharanjeet11](https://github.com/SinghCharanjeet11)
