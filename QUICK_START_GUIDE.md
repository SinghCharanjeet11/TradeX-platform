# TradeX Quick Start Guide

## 🚀 Start the Application (2 Steps)

### Step 1: Start Backend Server
```bash
cd server
npm run dev
```
✅ Server runs on: **http://localhost:5000**

### Step 2: Start Frontend Client (New Terminal)
```bash
cd client
npm run dev
```
✅ Client runs on: **http://localhost:3000**

### Step 3: Open Browser
Navigate to: **http://localhost:3000**

---

## 🧪 Run Tests

### Backend Tests
```bash
cd server
npm test
```

### Health Check
```bash
cd server
node test-health.js
```

---

## 🗄️ Database Management

### Initialize/Reset Database
```bash
cd server
npm run db:init
```

### Check Database Tables
The health check script will show all tables:
```bash
cd server
node test-health.js
```

---

## 📊 Current System Status

### ✅ Working Features
- User Authentication (Register/Login/Password Reset)
- Paper Trading (Virtual trading with $100,000)
- Portfolio Management (Track holdings & performance)
- News Feed (Browse, search, bookmark articles)
- Watchlist (Track favorite assets)
- Market Data (Crypto, stocks, forex, commodities)
- Price Alerts (Get notified on price changes)
- Connected Accounts (Binance integration)
- Dark/Light Theme Toggle

### ⚠️ Known Issues
1. **Alpha Vantage API** - May need key verification (stock quotes)
2. **CryptoCompare API** - Needs configuration (news sentiment)
3. **Bundle Size** - Client is 940KB (consider code splitting)

---

## 🔑 Environment Variables

All required variables are set in `server/.env`:
- ✅ Database connection
- ✅ JWT authentication
- ✅ Encryption key
- ✅ API keys (some need verification)

---

## 📁 Project Structure

```
TradeX/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── hooks/         # Custom React hooks
│   └── package.json
│
├── server/                # Express backend
│   ├── controllers/       # Route controllers
│   ├── services/          # Business logic
│   ├── repositories/      # Database access
│   ├── providers/         # External API providers
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── database/          # Migrations & setup
│   └── package.json
│
└── .kiro/specs/          # Feature specifications
    ├── paper-trading/
    ├── portfolio-enhancements/
    ├── news-feed-enhancement/
    └── ...
```

---

## 🛠️ Common Commands

### Development
```bash
# Start backend with auto-reload
cd server && npm run dev

# Start frontend with hot reload
cd client && npm run dev
```

### Production Build
```bash
# Build frontend for production
cd client && npm run build

# Start backend in production mode
cd server && npm start
```

### Testing
```bash
# Run all tests
cd server && npm test

# Run tests in watch mode
cd server && npm run test:watch

# Run health check
cd server && node test-health.js
```

### Database
```bash
# Initialize database
cd server && npm run db:init

# Reset database (drops and recreates)
cd server && npm run db:reset
```

---

## 🎯 First Time Setup Checklist

- [x] Node.js installed (v22.17.0)
- [x] npm installed (v10.9.2)
- [x] PostgreSQL installed and running
- [x] Database created (`tradex_auth`)
- [x] Dependencies installed (client & server)
- [x] Environment variables configured
- [x] Database migrations run
- [x] Server starts successfully
- [x] Client builds successfully

---

## 📞 Troubleshooting

### Server won't start
1. Check if PostgreSQL is running
2. Verify database credentials in `server/.env`
3. Run `npm run db:init` to initialize database

### Client won't start
1. Check if port 3000 is available
2. Run `npm install` in client directory
3. Clear node_modules and reinstall if needed

### Database connection errors
1. Verify PostgreSQL is running
2. Check credentials in `server/.env`
3. Ensure database `tradex_auth` exists

### API errors (401/403)
1. Check if server is running
2. Verify API keys in `server/.env`
3. Check browser console for CORS errors

---

## 🎉 You're All Set!

Your TradeX application is fully operational. Start both servers and begin trading!

For detailed system status, see: `SYSTEM_STATUS_REPORT.md`
