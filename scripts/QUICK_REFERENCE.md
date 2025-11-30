# Scripts Quick Reference

## Most Useful Scripts

### 🏥 System Health Check
```bash
node scripts/test-system-health.js
```
Comprehensive check of database, server, and all APIs. Run this first when troubleshooting.

### 🔑 API Keys Test
```bash
node scripts/test-api-keys.js
```
Verifies all external API keys are configured and working (Alpha Vantage, CryptoCompare, CoinGecko).

### 🧪 Backend API Test
```bash
node scripts/test-backend.js
```
Full test suite for all backend endpoints. Requires server to be running.

### ⚡ Quick Health Check
```bash
node scripts/test-health.js
```
Fast check of environment, database, and server status.

## Specialized Scripts

### Database
- `check-table-schema.js` - Inspect database table structures

### Authentication
- `test-encryption.js` - Test encryption/decryption
- `test-connect-account.js` - Debug account connection

### Binance Integration
- `test-binance-connection.js` - Full Binance connection flow
- `test-binance-signature.js` - Diagnose signature issues
- `test-binance-error-handling.js` - Verify error handling

## When to Use What

| Scenario | Script |
|----------|--------|
| App not working | `test-system-health.js` |
| Market data issues | `test-api-keys.js` |
| API endpoint broken | `test-backend.js` |
| Database problems | `check-table-schema.js` |
| Binance connection fails | `test-binance-connection.js` |
| Quick status check | `test-health.js` |

## Notes

- All scripts run from project root
- Some require the server to be running
- Scripts are for development only (not deployed)
- Update credentials in scripts as needed for testing
