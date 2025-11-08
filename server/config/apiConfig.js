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
    timeout: 10000, // 10 seconds
    rateLimit: {
      callsPerMinute: 50,
      callsPerHour: 500
    }
  },

  // Alpha Vantage API Configuration
  alphaVantage: {
    apiKey: process.env.ALPHA_VANTAGE_API_KEY,
    baseUrl: process.env.ALPHA_VANTAGE_API_URL || 'https://www.alphavantage.co/query',
    timeout: 10000, // 10 seconds
    rateLimit: {
      callsPerMinute: 5,
      callsPerDay: 25 // Free tier limit
    }
  },

  // Cache TTL Configuration (in seconds)
  cache: {
    crypto: 30,      // 30 seconds for crypto (high volatility)
    stocks: 60,      // 60 seconds for stocks
    forex: 60,       // 60 seconds for forex
    commodities: 120, // 120 seconds for commodities
    charts: 300      // 5 minutes for chart data
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

  // Alpha Vantage API key is required for stocks, forex, commodities
  if (!apiConfig.alphaVantage.apiKey) {
    errors.push('ALPHA_VANTAGE_API_KEY is not configured in environment variables');
  }

  if (errors.length > 0) {
    console.error('❌ API Configuration Errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\n📝 Please add the required API keys to your .env file');
    console.error('   Get your free Alpha Vantage API key at: https://www.alphavantage.co/support/#api-key\n');
    return false;
  }

  console.log('✅ API Configuration validated successfully');
  return true;
}
