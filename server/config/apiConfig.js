/**
 * API Configuration
 * Centralized configuration for external API integrations
 */

import dotenv from 'dotenv';
dotenv.config();

export const apiConfig = {
  // CoinGecko API Configuration (No key required)
  coingecko: {
    baseUrl: process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3',
    timeout: 15000, // 15 seconds (increased for better reliability)
    rateLimit: {
      callsPerMinute: 50,
      callsPerHour: 500
    }
  },

  // Finnhub API Configuration (Stocks)
  finnhub: {
    apiKey: process.env.FINNHUB_API_KEY,
    baseUrl: process.env.FINNHUB_API_URL || 'https://finnhub.io/api/v1',
    timeout: 15000,
    rateLimit: {
      callsPerMinute: 60,
      callsPerDay: 'unlimited' // Free tier
    }
  },

  // Fixer.io API Configuration (Forex)
  fixer: {
    apiKey: process.env.FIXER_API_KEY,
    baseUrl: process.env.FIXER_API_URL || 'http://data.fixer.io/api',
    timeout: 15000,
    rateLimit: {
      callsPerMonth: 100 // Free tier
    }
  },

  // Metals-API Configuration (Commodities)
  metalsApi: {
    apiKey: process.env.METALS_API_KEY,
    baseUrl: process.env.METALS_API_URL || 'https://metals-api.com/api',
    timeout: 15000,
    rateLimit: {
      callsPerMonth: 50 // Free tier
    }
  },

  // Cache TTL Configuration (in seconds)
  cache: {
    crypto: 60,        // 1 minute for crypto (real-time)
    stocks: 60,        // 1 minute for stocks (real-time with Finnhub)
    forex: 3600,       // 1 hour for forex (to respect monthly limits)
    commodities: 3600, // 1 hour for commodities (to respect monthly limits)
    charts: 1800       // 30 minutes for chart data
  },

  // Retry Configuration
  retry: {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 5000,     // 5 seconds
    backoffMultiplier: 2
  }
};

/**
 * Validate API configuration
 * Ensures required API keys and settings are present
 */
export function validateConfig() {
  const errors = [];
  const warnings = [];

  // Finnhub API key is required for stocks
  if (!apiConfig.finnhub.apiKey) {
    errors.push('FINNHUB_API_KEY is not configured in environment variables');
  }

  // Fixer.io API key is required for forex
  if (!apiConfig.fixer.apiKey) {
    warnings.push('FIXER_API_KEY is not configured - forex data will be unavailable');
  }

  // Metals-API key is required for commodities
  if (!apiConfig.metalsApi.apiKey) {
    warnings.push('METALS_API_KEY is not configured - commodities data will be unavailable');
  }

  if (errors.length > 0) {
    console.error('❌ API Configuration Errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\n📝 Please add the required API keys to your .env file:');
    console.error('   Finnhub (Stocks): https://finnhub.io/register');
    console.error('   Fixer.io (Forex): https://fixer.io/signup/free');
    console.error('   Metals-API (Commodities): https://metals-api.com/signup/free\n');
    return false;
  }

  if (warnings.length > 0) {
    console.warn('⚠️  API Configuration Warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
    console.warn('');
  }

  console.log('✅ API Configuration validated successfully');
  return true;
}
