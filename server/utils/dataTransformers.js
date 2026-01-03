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

  return rawData
    .map(coin => {
      // Validate price before transformation
      const currentPrice = coin.current_price;
      if (currentPrice === null || currentPrice === undefined || currentPrice <= 0) {
        console.warn(`[DataTransformers] Skipping ${coin.symbol?.toUpperCase() || 'UNKNOWN'} - invalid price:`, currentPrice);
        return null;
      }

      return {
        id: coin.id || '',
        symbol: (coin.symbol || '').toUpperCase(),
        name: coin.name || 'Unknown',
        price: formatNumber(currentPrice, 8), // Use 8 decimals for crypto to handle small values
        change24h: formatNumber(coin.price_change_percentage_24h, 2),
        volume24h: formatNumber(coin.total_volume, 0),
        marketCap: formatNumber(coin.market_cap, 0),
        image: coin.image || null,
        lastUpdate: new Date().toISOString(),
        source: 'coingecko'
      };
    })
    .filter(coin => coin !== null); // Remove invalid entries
}

/**
 * Transform Finnhub stock data to standardized format
 * @param {Object} rawData - Raw data from Finnhub API
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
    if (!quote || quote.error) {
      continue;
    }

    // Finnhub returns: {c: current, h: high, l: low, o: open, pc: previousClose, d: change, dp: changePercent, t: timestamp}
    const currentPrice = parseFloat(quote.c || 0);
    const previousClose = parseFloat(quote.pc || 0);
    const change = parseFloat(quote.d || 0);
    const changePercent = parseFloat(quote.dp || 0);

    results.push({
      id: symbol.toLowerCase(),
      symbol: symbol,
      name: symbol, // Finnhub doesn't provide full name in quote
      price: formatNumber(currentPrice, 2),
      change24h: formatNumber(changePercent, 2),
      volume24h: null, // Not provided in quote endpoint
      marketCap: null, // Not provided in quote endpoint
      high: formatNumber(quote.h, 2),
      low: formatNumber(quote.l, 2),
      open: formatNumber(quote.o, 2),
      previousClose: formatNumber(previousClose, 2),
      changeValue: formatNumber(change, 2),
      lastUpdate: quote.t ? new Date(quote.t * 1000).toISOString() : new Date().toISOString(),
      source: 'finnhub'
    });
  }

  return results;
}

/**
 * Transform Finnhub candle data to standardized time series format
 * @param {Object} rawData - Raw candle data from Finnhub
 * @param {string} symbol - Stock symbol
 * @returns {Object} Standardized time series data
 */
function transformStockTimeSeries(rawData, symbol) {
  if (!rawData || rawData.s !== 'ok' || !Array.isArray(rawData.t)) {
    return { symbol, candles: [] };
  }

  const candles = rawData.t.map((timestamp, index) => ({
    timestamp: new Date(timestamp * 1000).toISOString(),
    open: formatNumber(rawData.o[index], 2),
    high: formatNumber(rawData.h[index], 2),
    low: formatNumber(rawData.l[index], 2),
    close: formatNumber(rawData.c[index], 2),
    volume: rawData.v ? formatNumber(rawData.v[index], 0) : 0
  }));

  return {
    symbol,
    candles,
    source: 'finnhub'
  };
}

/**
 * Transform Finnhub company profile to standardized format
 * @param {Object} rawData - Raw company profile from Finnhub
 * @returns {Object} Standardized company overview
 */
function transformCompanyOverview(rawData) {
  if (!rawData || !rawData.ticker) {
    return null;
  }

  return {
    symbol: rawData.ticker,
    name: rawData.name || rawData.ticker,
    country: rawData.country || null,
    currency: rawData.currency || 'USD',
    exchange: rawData.exchange || null,
    industry: rawData.finnhubIndustry || null,
    ipo: rawData.ipo || null,
    marketCap: rawData.marketCapitalization ? rawData.marketCapitalization * 1000000 : null,
    shareOutstanding: rawData.shareOutstanding || null,
    logo: rawData.logo || null,
    phone: rawData.phone || null,
    weburl: rawData.weburl || null,
    lastUpdate: new Date().toISOString(),
    source: 'finnhub'
  };
}

/**
 * Transform Fixer.io forex data to standardized format
 * @param {Object} rawData - Raw data from Fixer.io API
 * @param {Array} pairs - Array of forex pair names
 * @returns {Array} Standardized market data
 */
function transformForexData(rawData, pairs) {
  if (!rawData || typeof rawData !== 'object') {
    return [];
  }

  const results = [];

  for (const pairName of pairs) {
    const data = rawData[pairName];
    if (!data || data.error || !data.success) {
      continue;
    }

    // Fixer.io returns: {success: true, base: 'EUR', date: '2024-01-01', rates: {USD: 1.18}}
    const rate = data.rate || (data.rates && Object.values(data.rates)[0]) || 0;
    const fromCurrency = data.fromCurrency || data.base;
    const toCurrency = data.toCurrency || (data.rates && Object.keys(data.rates)[0]);

    // Calculate 24h change if we have historical data (placeholder for now)
    const change24h = 0; // Would need historical endpoint to calculate

    results.push({
      id: pairName.toLowerCase().replace('/', ''),
      symbol: pairName,
      name: `${fromCurrency} / ${toCurrency}`,
      price: formatNumber(rate, 5), // Forex typically uses more decimal places
      change24h: formatNumber(change24h, 2),
      volume24h: null, // Not provided by Fixer.io
      marketCap: null,
      fromCurrency: fromCurrency,
      toCurrency: toCurrency,
      rate: formatNumber(rate, 5),
      lastUpdate: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      source: 'fixer'
    });
  }

  return results;
}

/**
 * Transform Fixer.io historical data to time series format
 * @param {Object} rawData - Raw historical data from Fixer.io
 * @param {string} pair - Forex pair name
 * @returns {Object} Standardized time series data
 */
function transformForexTimeSeries(rawData, pair) {
  if (!rawData || !rawData.success || !rawData.rates) {
    return { pair, rates: [] };
  }

  const rates = [{
    date: rawData.date,
    rate: formatNumber(Object.values(rawData.rates)[0], 5),
    base: rawData.base,
    target: Object.keys(rawData.rates)[0]
  }];

  return {
    pair,
    rates,
    source: 'fixer'
  };
}

/**
 * Transform Metals-API commodity data to standardized format
 * @param {Object} rawData - Raw data from Metals-API
 * @param {Array} commoditySymbols - Array of commodity symbols
 * @returns {Array} Standardized market data
 */
function transformCommoditiesData(rawData, commoditySymbols) {
  if (!rawData || typeof rawData !== 'object') {
    return [];
  }

  const results = [];

  for (const symbol of commoditySymbols) {
    const data = rawData[symbol];
    if (!data || data.error || !data.success) {
      continue;
    }

    // Metals-API returns rates as inverse (e.g., USD per ounce of gold)
    // Rate is how much USD you get for 1 unit of the commodity
    // We need to invert it to get price per unit
    const rate = data.rate || (data.rates && data.rates[symbol]) || 0;
    const price = rate !== 0 ? 1 / rate : 0;

    // Calculate 24h change if we have historical data (placeholder for now)
    const change24h = 0; // Would need historical endpoint to calculate

    results.push({
      id: symbol.toLowerCase(),
      symbol: symbol,
      name: data.name || symbol,
      price: formatNumber(price, 2),
      change24h: formatNumber(change24h, 2),
      volume24h: null, // Not provided by Metals-API
      marketCap: null,
      unit: data.unit || 'USD',
      lastUpdate: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      source: 'metals-api'
    });
  }

  return results;
}

/**
 * Transform Metals-API historical data to time series format
 * @param {Object} rawData - Raw historical data from Metals-API
 * @param {string} symbol - Commodity symbol
 * @returns {Object} Standardized time series data
 */
function transformCommodityTimeSeries(rawData, symbol) {
  if (!rawData || !rawData.success || !rawData.rates) {
    return { symbol, rates: [] };
  }

  const rate = rawData.rates[symbol];
  const price = rate !== 0 ? 1 / rate : 0;

  const rates = [{
    date: rawData.date,
    price: formatNumber(price, 2),
    rate: formatNumber(rate, 6),
    base: rawData.base
  }];

  return {
    symbol,
    rates,
    source: 'metals-api'
  };
}

/**
 * Transform CoinGecko chart data to standardized format
 * @param {Object} rawData - Raw chart data from CoinGecko
 * @param {string} id - Cryptocurrency ID (e.g., 'bitcoin', 'ethereum')
 * @returns {Object} Standardized chart data
 */
function transformCryptoChartData(rawData, id) {
  if (!rawData || !rawData.prices) {
    console.warn(`[DataTransformers] No chart data for ${id}`);
    return { symbol: id, prices: [] };
  }

  console.log(`[DataTransformers] Transforming chart data for ${id}, ${rawData.prices.length} data points`);

  const prices = rawData.prices.map(([timestamp, price]) => ({
    timestamp,
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
    symbol: id,
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

  const num = parseFloat(value);
  if (isNaN(num)) {
    return 0;
  }

  // For very small numbers, use more precision
  if (Math.abs(num) < 0.000001 && num !== 0) {
    return parseFloat(num.toFixed(Math.min(decimals, 10)));
  }

  return parseFloat(num.toFixed(decimals));
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
  transformStockTimeSeries,
  transformCompanyOverview,
  transformForexData,
  transformForexTimeSeries,
  transformCommoditiesData,
  transformCommodityTimeSeries,
  transformCryptoChartData,
  transformCryptoDetailData,
  transformOHLCData,
  formatNumber,
  formatCurrency,
  formatLargeNumber
};
