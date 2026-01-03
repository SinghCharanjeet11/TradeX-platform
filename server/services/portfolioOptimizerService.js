import cacheService from './cacheService.js';
import portfolioService from './portfolioService.js';

/**
 * Portfolio Optimizer Service
 * Analyzes portfolio allocation and provides optimization suggestions
 */
class PortfolioOptimizerService {
  /**
   * Analyze portfolio and generate optimization suggestions
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Optimization analysis
   */
  async optimizePortfolio(userId) {
    try {
      // Check cache first
      const cacheKey = `portfolio_optimization:${userId}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Get user's portfolio
      let portfolio;
      try {
        portfolio = await portfolioService.getPortfolio(userId);
      } catch (error) {
        console.warn('Error fetching portfolio for optimization:', error);
        portfolio = null;
      }

      if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
        return {
          isOptimized: true,
          message: 'No portfolio to optimize. Start by adding some holdings.',
          currentAllocation: {},
          recommendedAllocation: {},
          suggestions: [],
          trades: []
        };
      }

      // Analyze current allocation
      const currentAllocation = this._analyzeCurrentAllocation(portfolio);

      // Generate recommended allocation
      const recommendedAllocation = this._generateRecommendedAllocation();

      // Check if portfolio is already well-optimized
      const isOptimized = this._isPortfolioOptimized(
        currentAllocation,
        recommendedAllocation
      );

      if (isOptimized) {
        const result = {
          isOptimized: true,
          message: 'Your portfolio is well-optimized! No changes needed at this time.',
          currentAllocation,
          recommendedAllocation: currentAllocation,
          suggestions: ['Maintain current allocation', 'Continue monitoring market conditions'],
          trades: []
        };

        // Cache for 1 hour
        await cacheService.set(cacheKey, result, 3600);
        return result;
      }

      // Generate optimization suggestions
      const suggestions = this._generateSuggestions(
        currentAllocation,
        recommendedAllocation
      );

      // Generate trade recommendations
      const trades = this._generateTradeRecommendations(
        portfolio,
        currentAllocation,
        recommendedAllocation
      );

      const result = {
        isOptimized: false,
        message: 'We found some opportunities to optimize your portfolio.',
        currentAllocation,
        recommendedAllocation,
        suggestions,
        trades
      };

      // Cache for 1 hour
      await cacheService.set(cacheKey, result, 3600);

      return result;
    } catch (error) {
      console.error('Error optimizing portfolio:', error);
      // Return fallback instead of throwing
      return {
        isOptimized: true,
        message: 'Unable to generate optimization at this time.',
        currentAllocation: {},
        recommendedAllocation: {},
        suggestions: [],
        trades: []
      };
    }
  }

  /**
   * Analyze current portfolio allocation
   * @private
   */
  _analyzeCurrentAllocation(portfolio) {
    const holdings = portfolio.holdings || [];
    const totalValue = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);

    // Group by asset type
    const allocationByType = {};

    holdings.forEach(holding => {
      const type = holding.assetType || 'unknown';
      if (!allocationByType[type]) {
        allocationByType[type] = 0;
      }

      allocationByType[type] += holding.currentValue || 0;
    });

    // Calculate percentages and return as object
    const allocation = {};
    Object.entries(allocationByType).forEach(([type, value]) => {
      allocation[type] = totalValue > 0 ? (value / totalValue) * 100 : 0;
    });

    return allocation;
  }

  /**
   * Generate recommended allocation based on diversification principles
   * @private
   */
  _generateRecommendedAllocation() {
    // Simple diversification strategy based on risk tolerance
    // This is a simplified model - in production, would use more sophisticated algorithms
    const idealAllocation = {
      crypto: 40,    // Higher risk, higher reward
      stock: 35,     // Moderate risk
      forex: 15,     // Lower risk
      commodity: 10  // Stability/hedge
    };

    // Return as object with percentages
    return idealAllocation;
  }

  /**
   * Check if portfolio is already well-optimized
   * @private
   */
  _isPortfolioOptimized(currentAllocation, recommendedAllocation) {
    // Portfolio is considered optimized if all allocations are within 5% of recommended
    const threshold = 5; // 5% tolerance

    for (const [assetType, recommendedPercentage] of Object.entries(recommendedAllocation)) {
      const currentPercentage = currentAllocation[assetType] || 0;
      const diff = Math.abs(currentPercentage - recommendedPercentage);

      if (diff > threshold) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate human-readable optimization suggestions
   * @private
   */
  _generateSuggestions(currentAllocation, recommendedAllocation) {
    const suggestions = [];

    Object.entries(recommendedAllocation).forEach(([assetType, recommendedPercentage]) => {
      const currentPercentage = currentAllocation[assetType] || 0;
      const diff = recommendedPercentage - currentPercentage;

      if (Math.abs(diff) > 5) {
        if (diff > 0) {
          suggestions.push(
            `Increase ${assetType} allocation by ${Math.abs(diff).toFixed(1)}% for better diversification`
          );
        } else {
          suggestions.push(
            `Reduce ${assetType} exposure by ${Math.abs(diff).toFixed(1)}% to manage risk`
          );
        }
      }
    });

    // Add general suggestions
    const currentTypes = Object.keys(currentAllocation).length;
    if (currentTypes < 2) {
      suggestions.push('Consider diversifying across multiple asset types to reduce risk');
    }

    if (suggestions.length === 0) {
      suggestions.push('Your portfolio allocation is well-balanced');
    }

    return suggestions;
  }

  /**
   * Generate specific trade recommendations to achieve target allocation
   * @private
   */
  _generateTradeRecommendations(portfolio, currentAllocation, recommendedAllocation) {
    const trades = [];
    const holdings = portfolio.holdings || [];
    
    // Calculate total portfolio value
    const totalValue = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);

    Object.entries(recommendedAllocation).forEach(([assetType, recommendedPercentage]) => {
      const currentPercentage = currentAllocation[assetType] || 0;
      const currentValue = (totalValue * currentPercentage) / 100;
      const targetValue = (totalValue * recommendedPercentage) / 100;
      const diff = targetValue - currentValue;

      // Only generate trades for significant differences (> $100 or > 5%)
      if (Math.abs(diff) > 100 && Math.abs(diff / totalValue) > 0.05) {
        if (diff > 0) {
          // Need to buy more of this asset type
          trades.push({
            action: 'BUY',
            assetType: assetType,
            symbol: this._suggestSymbolForType(assetType, holdings),
            amount: Math.abs(diff).toFixed(2),
            reason: `Increase ${assetType} allocation to ${recommendedPercentage.toFixed(1)}%`,
            priority: Math.abs(diff) > 500 ? 'high' : 'medium'
          });
        } else {
          // Need to sell some of this asset type
          const holdingsOfType = holdings.filter(
            h => h.assetType === assetType
          );

          if (holdingsOfType.length > 0) {
            // Suggest selling the holding with lowest performance or highest value
            const toSell = holdingsOfType.sort((a, b) => {
              const profitA = (a.profitLoss || 0) / (a.currentValue || 1);
              const profitB = (b.profitLoss || 0) / (b.currentValue || 1);
              return profitA - profitB; // Sell worst performers first
            })[0];

            trades.push({
              action: 'SELL',
              assetType: assetType,
              symbol: toSell.symbol,
              amount: Math.min(Math.abs(diff), toSell.currentValue).toFixed(2),
              reason: `Reduce ${assetType} exposure to ${recommendedPercentage.toFixed(1)}%`,
              priority: Math.abs(diff) > 500 ? 'high' : 'medium'
            });
          }
        }
      }
    });

    // Sort by priority
    return trades.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Suggest a symbol for a given asset type
   * @private
   */
  _suggestSymbolForType(assetType, existingHoldings) {
    // Check if user already has holdings of this type
    const existingOfType = existingHoldings.filter(h => h.assetType === assetType);

    if (existingOfType.length > 0) {
      // Suggest adding to existing position
      return existingOfType[0].symbol;
    }

    // Suggest popular assets by type
    const suggestions = {
      crypto: 'BTC',
      stock: 'SPY', // S&P 500 ETF for diversification
      forex: 'EUR/USD',
      commodity: 'GLD' // Gold ETF
    };

    return suggestions[assetType] || 'N/A';
  }
}

export default new PortfolioOptimizerService();
