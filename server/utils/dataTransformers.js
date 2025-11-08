/**
 * Data Transformers
 * Transform external API responses to standardized format
 */

/**
 * Transform CoinGecko cryptocurrency data to standardized format
 * @param {Array} rawData - Raw data from CoinGecko API
 * @returns {Array} Standardized market data
 */
function transformCryptoData(rawData) {
  if (!Array.isArray(rawData)) {
    return [];
  }

  return rawData.map(coin => ({
    id: coin.id || '',
    symbol: (coin.symbol || '').toUpperCase(),
    name: coin.name || 'Unknown',
    price: formatNumber(coin.current_price, 2),
    change24h: formatNumber(coin.price_change_percentage_24h, 2),
    volume24h: formatNumber(coin.total_volume, 0),
    marketCap: formatNumber(coin.market_cap, 0),
    image: coin.image || null,
    lastUpdate: new Date().toISOString(),
    source: 'coingecko'
  }));
}

/**
 * Transform Alpha Vantage stock data to standardized format
 * @param {Object} rawData - Raw data from Alpha Vantage API
 * @param {Array} symbols - Array of stock symbols
 * @returns {Array} Standardized market data
 */
function transformStocksData(rawData, symbols) {
  if (!rawData || typeof rawData !== 'object') {
    return [];
  }

  const results = [];

  for (const symbol of symbols) {
    const quote = rawData[symbol];
    if (!quote || !quote['Global Quote']) {
      continue;
    }

    const data = quote['Global Quote'];
    const currentPrice = parseFloat(data['05. price'] || 0);
    const previousClose = parseFloat(data['08. previous close'] || 0);
    const change = currentPrice - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    results.push({
      id: symbol.toLowerCase(),
      symbol: symbol,
      name: symbol, // Alpha Vantage doesn't provide full name in quote
      price: formatNumber(currentPrice, 2),
      change24h: formatNumber(changePercent, 2),
      volume24h: formatNumber(parseInt(data['06. volume'] || 0), 0),
      marketCap: null, // Not provided by Alpha Vantage in quote
      lastUpdate: data['07. latest trading day'] || new Date().toISOString(),
      source: 'alphavantage'
    });
  }

  return results;
}

/**
 * Transform Alpha Vantage forex data to standardized format
 * @param {Object} rawData - Raw data from Alpha Vantage API
 * @param {Array} pairs - Array of forex pairs
 * @returns {Array} Standardized market data
 */
function transformForexData(rawData, pairs) {
  if (!rawData || typeof rawData !== 'object') {
    return [];
  }

  const results = [];

  for (const pair of pairs) {
    const data = rawData[pair];
    if (!data || !data['Realtime Currency Exchange Rate']) {
      continue;
    }

    const exchangeData = data['Realtime Currency Exchange Rate'];
    const rate = parseFloat(exchangeData['5. Exchange Rate'] || 0);
    const bidPrice = parseFloat(exchangeData['8. Bid Price'] || rate);
    const askPrice = parseFloat(exchangeData['9. Ask Price'] || rate);

    // Calculate approximate 24h change (Alpha Vantage doesn't provide this directly)
    // In production, you'd need to fetch historical data or use a different endpoint
    const change24h = 0; // Placeholder

    results.push({
      id: pair.toLowerCase().replace('/', ''),
      symbol: pair,
      name: `${exchangeData['2. From_Currency Name']} / ${exchangeData['4. To_Currency Name']}`,
      price: formatNumber(rate, 5), // Forex typically uses more decimal places
      change24h: formatNumber(change24h, 2),
      volume24h: null, // Not provided by Alpha Vantage
      marketCap: null,
      bidPrice: formatNumber(bidPrice, 5),
      askPrice: formatNumber(askPrice, 5),
      spread: formatNumber(askPrice - bidPrice, 5),
      lastUpdate: exchangeData['6. Last Refreshed'] || new Date().toISOString(),
      source: 'alphavantage'
    });
  }

  return results;
}

/**
 * Transform Alpha Vantage commodity data to standardized format
 * @param {Object} rawData - Raw data from Alpha Vantage API
 * @param {Array} commodities - Array of commodity symbols with metadata
 * @returns {Array} Standardized market data
 */
function transformCommoditiesData(rawData, commodities) {
  if (!rawData || typeof rawData !== 'object') {
    return [];
  }

  const results = [];

  for (const commodity of commodities) {
    const data = rawData[commodity.symbol];
    if (!data || !data['Global Quote']) {
      continue;
    }

    const quote = data['Global Quote'];
    const currentPrice = parseFloat(quote['05. price'] || 0);
    const previousClose = parseFloat(quote['08. previous close'] || 0);
    const change = currentPrice - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    results.push({
      id: commodity.symbol.toLowerCase(),
      symbol: commodity.symbol,
      name: commodity.name,
      price: formatNumber(currentPrice, 2),
      change24h: formatNumber(changePercent, 2),
      volume24h: formatNumber(parseInt(quote['06. volume'] || 0), 0),
      marketCap: null,
      unit: commodity.unit || 'USD',
      lastUpdate: quote['07. latest trading day'] || new Date().toISOString(),
      source: 'alphavantage'
    });
  }

  return results;
}

/**
 * Transform CoinGecko chart data to standardized format
 * @param {Object} rawData - Raw chart data from CoinGecko
 * @param {string} symbol - Cryptocurrency symbol
 * @returns {Object} Standardized chart data
 */
function transformCryptoChartData(rawData, symbol) {
  if (!rawData || !rawData.prices) {
    return { symbol, prices: [] };
  }

  const prices = rawData.prices.map(([timestamp, price]) => ({
    timestamp: new Date(timestamp).toISOString(),
    price: formatNumber(price, 2),
    volume: 0 // Will be populated if volume data is available
  }));

  // Add volume data if available
  if (rawData.total_volumes && rawData.total_volumes.length === prices.length) {
    rawData.total_volumes.forEach(([timestamp, volume], index) => {
      prices[index].volume = formatNumber(volume, 0);
    });
  }

  return {
    symbol,
    prices,
    source: 'coingecko'
  };
}

/**
 * Transform detailed cryptocurrency data for asset detail modal
 * @param {Object} rawData - Raw detailed data from CoinGecko
 * @returns {Object} Standardized detailed asset data
 */
function transformCryptoDetailData(rawData) {
  if (!rawData || !rawData.id) {
    return null;
  }

  const marketData = rawData.market_data || {};
  const currentPrice = marketData.current_price?.usd || 0;
  const priceChange24h = marketData.price_change_percentage_24h || 0;

  return {
    id: rawData.id,
    symbol: (rawData.symbol || '').toUpperCase(),
    name: rawData.name || 'Unknown',
    image: rawData.image?.large || rawData.image?.small || null,
    
    // Price data
    price: formatNumber(currentPrice, 2),
    change24h: formatNumber(priceChange24h, 2),
    change7d: formatNumber(marketData.price_change_percentage_7d, 2),
    change30d: formatNumber(marketData.price_change_percentage_30d, 2),
    change1y: formatNumber(marketData.price_change_percentage_1y, 2),
    
    // Market stats
    marketCap: marketData.market_cap?.usd || 0,
    marketCapRank: rawData.market_cap_rank || null,
    volume24h: marketData.total_volume?.usd || 0,
    volumeChange24h: formatNumber(marketData.volume_change_24h, 2),
    
    // Supply data
    circulatingSupply: marketData.circulating_supply || 0,
    totalSupply: marketData.total_supply || 0,
    maxSupply: marketData.max_supply || null,
    
    // Price ranges
    high24h: formatNumber(marketData.high_24h?.usd, 2),
    low24h: formatNumber(marketData.low_24h?.usd, 2),
    ath: formatNumber(marketData.ath?.usd, 2),
    athDate: marketData.ath_date?.usd || null,
    athChangePercentage: formatNumber(marketData.ath_change_percentage?.usd, 2),
    atl: formatNumber(marketData.atl?.usd, 2),
    atlDate: marketData.atl_date?.usd || null,
    atlChangePercentage: formatNumber(marketData.atl_change_percentage?.usd, 2),
    
    // Additional data
    description: rawData.description?.en || '',
    homepage: rawData.links?.homepage?.[0] || null,
    blockchainSite: rawData.links?.blockchain_site?.[0] || null,
    
    // Community data
    communityScore: rawData.community_score || 0,
    developerScore: rawData.developer_score || 0,
    liquidityScore: rawData.liquidity_score || 0,
    publicInterestScore: rawData.public_interest_score || 0,
    
    lastUpdate: new Date().toISOString(),
    source: 'coingecko'
  };
}

/**
 * Transform OHLC data for candlestick charts
 * @param {Array} rawData - Raw OHLC data from CoinGecko
 * @param {string} symbol - Cryptocurrency symbol
 * @returns {Object} Standardized OHLC data
 */
function transformOHLCData(rawData, symbol) {
  if (!Array.isArray(rawData)) {
    return { symbol, candles: [] };
  }

  const candles = rawData.map(([timestamp, open, high, low, close]) => ({
    timestamp: new Date(timestamp).toISOString(),
    open: formatNumber(open, 2),
    high: formatNumber(high, 2),
    low: formatNumber(low, 2),
    close: formatNumber(close, 2)
  }));

  return {
    symbol,
    candles,
    source: 'coingecko'
  };
}

/**
 * Format number with specified decimal places
 * Handles null/undefined values gracefully
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {number} Formatted number
 */
function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }

  return parseFloat(parseFloat(value).toFixed(decimals));
}

/**
 * Format currency value
 * @param {number} value - Value to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
function formatCurrency(value, currency = 'USD') {
  if (value === null || value === undefined || isNaN(value)) {
    return `$0.00`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(value);
}

/**
 * Format large numbers with abbreviations (K, M, B, T)
 * @param {number} value - Value to format
 * @returns {string} Formatted string
 */
function formatLargeNumber(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  const absValue = Math.abs(value);
  
  if (absValue >= 1e12) {
    return (value / 1e12).toFixed(2) + 'T';
  } else if (absValue >= 1e9) {
    return (value / 1e9).toFixed(2) + 'B';
  } else if (absValue >= 1e6) {
    return (value / 1e6).toFixed(2) + 'M';
  } else if (absValue >= 1e3) {
    return (value / 1e3).toFixed(2) + 'K';
  }
  
  return value.toFixed(2);
}

export {
  transformCryptoData,
  transformStocksData,
  transformForexData,
  transformCommoditiesData,
  transformCryptoChartData,
  transformCryptoDetailData,
  transformOHLCData,
  formatNumber,
  formatCurrency,
  formatLargeNumber
};
