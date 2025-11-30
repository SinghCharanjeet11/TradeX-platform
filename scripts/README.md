# Development Scripts

This directory contains utility scripts for testing and debugging the TradeX application.

## Test Scripts

### System Health
- `test-system-health.js` - Comprehensive system health check (database, server, APIs)
- `test-backend.js` - Full backend API test suite

### Database
- `check-table-schema.js` - Inspect database table schemas

### Authentication & Security
- `test-encryption.js` - Test encryption/decryption functionality
- `test-connect-account.js` - Debug account connection endpoint

### Binance Integration
- `test-binance-connection.js` - Test complete Binance connection flow
- `test-binance-signature.js` - Diagnose Binance API signature issues
- `test-binance-error-handling.js` - Verify Binance error handling

## Usage

Run any script from the project root:

```bash
# System health check
node scripts/test-system-health.js

# Full backend API test
node scripts/test-backend.js

# Test API keys
node scripts/test-api-keys.js

# Quick health check
node scripts/test-health.js

# Database schema inspection
node scripts/check-table-schema.js

# Binance tests
node scripts/test-binance-connection.js
node scripts/test-binance-signature.js
```

## Notes

- These scripts are for development/debugging only
- Do not deploy these to production
- Some scripts require the server to be running
- Update credentials in scripts as needed for testing
