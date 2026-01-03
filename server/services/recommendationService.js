import cacheService from './cacheService.js';
import portfolioService from './portfolioService.js';
import marketService from './marketService.js';

/**
 * Recommendation Engine Service
 * Generates personalized trading recommendations based on portfolio composition and market trends
 */
class RecommendationService {
  /**
   * Generate personalized recommendations for a user
   * @param {number} userId - User ID
   * @param {number} limit - Maximum number of recommendations (default: 5)
   * @returns {Promise<Object>} - Object with recommendations array
   */
  async generateRecommendations(userId, limit = 5) {
    try {
      // Check cache first
      const cacheKey = `recommendations:${userId}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        // Filter out dismissed recommendations from cache
        const filteredRecommendations = cached.recommendations.filter(rec => 
          !this.isRecommendationDismissed(userId, rec.symbol)
        );
        
        console.log(`[RecommendationService] Cache hit for user ${userId}: ${cached.recommendations.length} total, ${filteredRecommendations.length} after filtering dismissed`);
        
        return {
          ...cached,
          recommendations: filteredRecommendations,
          count: filteredRecommendations.length
        };
      }

      // Get user's portfolio
      let portfolio;
      try {
        portfolio = await portfolioService.getPortfolio(userId);
      } catch (error) {
        console.warn('Error fetching portfolio, using general recommendations:', error);
        portfolio = null;
      }
      
      let recommendations;
      
      if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
        // New user - provide general market recommendations
        recommendations = await this._generateGeneralRecommendations(limit);
      } else {
        // Existing user - provide personalized recommendations
        recommendations = await this._generatePersonalizedRecommendations(
          userId,
          portfolio,
          limit
        );
      }

      // Ensure we have between 3 and 10 recommendations
      const boundedRecommendations = this._ensureRecommendationBounds(
        recommendations,
        limit
      );

      // Add unique IDs to each recommendation
      const recommendationsWithIds = boundedRecommendations.map((rec, index) => ({
        id: `${userId}-${rec.symbol}-${Date.now()}-${index}`,
        ...rec
      }));

      // Filter out dismissed recommendations
      const filteredRecommendations = recommendationsWithIds.filter(rec => 
        !this.isRecommendationDismissed(userId, rec.symbol)
      );

      console.log(`[RecommendationService] Generated ${recommendationsWithIds.length} recommendations for user ${userId}, ${filteredRecommendations.length} after filtering dismissed`);

      // Return in expected format
      const result = {
        recommendations: filteredRecommendations,
        count: filteredRecommendations.length,
        generatedAt: new Date().toISOString()
      };

      // Cache for 30 minutes
      await cacheService.set(cacheKey, result, 1800);

      return result;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Return fallback recommendations instead of throwing
      return {
        recommendations: [],
        count: 0,
        generatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Generate personalized recommendations based on portfolio
   * @private
   */
  async _generatePersonalizedRecommendations(_userId, portfolio, limit) {
    const recommendations = [];

    // Analyze portfolio composition
    const analysis = this._analyzePortfolio(portfolio);

    // 1. Diversification opportunities
    if (analysis.needsDiversification) {
      const diversificationRecs = await this._getDiversificationRecommendations(
        portfolio,
        analysis
      );
      recommendations.push(...diversificationRecs);
    }

    // 2. Trending assets in underrepresented categories
    const trendingRecs = await this._getTrendingRecommendations(
      portfolio,
      analysis
    );
    recommendations.push(...trendingRecs);

    // 3. Similar assets to high performers in portfolio
    const similarRecs = await this._getSimilarAssetRecommendations(portfolio);
    recommendations.push(...similarRecs);

    // Limit and prioritize
    return recommendations.slice(0, Math.max(limit, 10));
  }

  /**
   * Generate general market recommendations for new users
   * @private
   */
  async _generateGeneralRecommendations(limit) {
    const recommendations = [];

    try {
      // Get top gainers across different asset types
      const cryptoGainers = await marketService.getTopGainers('crypto', 2);
      const stockGainers = await marketService.getTopGainers('stock', 2);

      // Add crypto recommendations
      if (cryptoGainers && cryptoGainers.length > 0) {
        cryptoGainers.forEach(asset => {
          recommendations.push({
            symbol: asset.symbol,
            assetType: 'crypto',
            reason: 'trending',
            title: `${asset.name || asset.symbol} is trending`,
            description: `Strong upward momentum with ${asset.change24h?.toFixed(2)}% gain in 24h`,
            confidence: 75,
            actionType: 'explore',
            metadata: {
              id: asset.id,
              name: asset.name,
              currentPrice: asset.price,
              change24h: asset.change24h,
              volume: asset.volume,
              image: asset.image
            }
          });
        });
      }

      // Add stock recommendations
      if (stockGainers && stockGainers.length > 0) {
        stockGainers.forEach(asset => {
          recommendations.push({
            symbol: asset.symbol,
            assetType: 'stock',
            reason: 'trending',
            title: `${asset.name || asset.symbol} shows strong performance`,
            description: `Positive market momentum with ${asset.change24h?.toFixed(2)}% gain`,
            confidence: 70,
            actionType: 'explore',
            metadata: {
              id: asset.id,
              name: asset.name,
              currentPrice: asset.price,
              change24h: asset.change24h,
              volume: asset.volume,
              image: asset.image
            }
          });
        });
      }

      // Add diversification recommendation
      recommendations.push({
        symbol: 'PORTFOLIO',
        assetType: 'general',
        reason: 'diversification',
        title: 'Start building a diversified portfolio',
        description: 'Consider spreading investments across crypto, stocks, and other asset classes',
        confidence: 80,
        actionType: 'learn',
        metadata: {}
      });

    } catch (error) {
      console.error('Error generating general recommendations:', error);
      // Return basic fallback recommendations
      recommendations.push({
        symbol: 'BTC',
        assetType: 'crypto',
        reason: 'popular',
        title: 'Bitcoin - Market leader',
        description: 'The most established cryptocurrency with strong market presence',
        confidence: 70,
        actionType: 'explore',
        metadata: {}
      });
    }

    return recommendations.slice(0, Math.max(limit, 10));
  }

  /**
   * Analyze portfolio composition
   * @private
   */
  _analyzePortfolio(portfolio) {
    const holdings = portfolio.holdings || [];
    
    // Count assets by type
    const assetTypeCounts = {};
    let totalValue = 0;

    holdings.forEach(holding => {
      const type = holding.assetType || 'unknown';
      assetTypeCounts[type] = (assetTypeCounts[type] || 0) + 1;
      totalValue += holding.currentValue || 0;
    });

    // Calculate concentration
    const uniqueTypes = Object.keys(assetTypeCounts).length;
    const needsDiversification = uniqueTypes < 2 || holdings.length < 3;

    // Find dominant asset type
    let dominantType = null;
    let maxCount = 0;
    Object.entries(assetTypeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    });

    return {
      totalHoldings: holdings.length,
      assetTypeCounts,
      uniqueTypes,
      needsDiversification,
      dominantType,
      totalValue
    };
  }

  /**
   * Get diversification recommendations
   * @private
   */
  async _getDiversificationRecommendations(_portfolio, analysis) {
    const recommendations = [];
    const underrepresentedTypes = ['crypto', 'stock', 'forex', 'commodity']
      .filter(type => !analysis.assetTypeCounts[type]);

    for (const type of underrepresentedTypes.slice(0, 2)) {
      try {
        const topAssets = await marketService.getTopGainers(type, 1);
        if (topAssets && topAssets.length > 0) {
          const asset = topAssets[0];
          recommendations.push({
            symbol: asset.symbol,
            assetType: type,
            reason: 'diversification',
            title: `Diversify into ${type}`,
            description: `Your portfolio lacks ${type} exposure. ${asset.name || asset.symbol} is performing well`,
            confidence: 75,
            actionType: 'consider',
            metadata: {
              id: asset.id,
              name: asset.name,
              currentPrice: asset.price,
              change24h: asset.change24h,
              image: asset.image
            }
          });
        }
      } catch (error) {
        console.error(`Error getting ${type} recommendations:`, error);
      }
    }

    return recommendations;
  }

  /**
   * Get trending asset recommendations
   * @private
   */
  async _getTrendingRecommendations(portfolio, analysis) {
    const recommendations = [];

    try {
      // Get trending assets from underrepresented categories
      const types = Object.keys(analysis.assetTypeCounts);
      
      for (const type of types.slice(0, 2)) {
        const trending = await marketService.getTopGainers(type, 1);
        if (trending && trending.length > 0) {
          const asset = trending[0];
          
          // Check if user already has this asset
          const alreadyOwned = portfolio.holdings.some(
            h => h.symbol === asset.symbol
          );

          if (!alreadyOwned) {
            recommendations.push({
              symbol: asset.symbol,
              assetType: type,
              reason: 'trending',
              title: `${asset.name || asset.symbol} is trending in ${type}`,
              description: `Strong performance with ${asset.change24h?.toFixed(2)}% gain`,
              confidence: 70,
              actionType: 'explore',
              metadata: {
                id: asset.id,
                name: asset.name,
                currentPrice: asset.price,
                change24h: asset.change24h,
                volume: asset.volume,
                image: asset.image
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error getting trending recommendations:', error);
    }

    return recommendations;
  }

  /**
   * Get recommendations for similar assets to high performers
   * @private
   */
  async _getSimilarAssetRecommendations(portfolio) {
    const recommendations = [];

    try {
      // Find top performing holdings
      const holdings = portfolio.holdings || [];
      const performers = holdings
        .filter(h => h.profitLoss && h.profitLoss > 0)
        .sort((a, b) => (b.profitLoss || 0) - (a.profitLoss || 0))
        .slice(0, 2);

      for (const holding of performers) {
        // For simplicity, recommend other assets in the same category
        const similar = await marketService.getTopGainers(holding.assetType, 1);
        
        if (similar && similar.length > 0) {
          const asset = similar[0];
          
          // Don't recommend assets already owned
          const alreadyOwned = holdings.some(h => h.symbol === asset.symbol);
          
          if (!alreadyOwned && asset.symbol !== holding.symbol) {
            recommendations.push({
              symbol: asset.symbol,
              assetType: holding.assetType,
              reason: 'similar_to_performer',
              title: `Similar to your ${holding.symbol} position`,
              description: `${asset.name || asset.symbol} shows similar patterns to your profitable holdings`,
              confidence: 65,
              actionType: 'consider',
              metadata: {
                id: asset.id,
                name: asset.name,
                currentPrice: asset.price,
                change24h: asset.change24h,
                relatedTo: holding.symbol,
                image: asset.image
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error getting similar asset recommendations:', error);
    }

    return recommendations;
  }

  /**
   * Ensure recommendation count is within bounds (3-10)
   * @private
   */
  _ensureRecommendationBounds(recommendations, requestedLimit) {
    const minRecommendations = 3;
    const maxRecommendations = 10;
    
    // Ensure we have at least the minimum
    if (recommendations.length < minRecommendations) {
      // Pad with generic recommendations if needed
      while (recommendations.length < minRecommendations) {
        recommendations.push({
          symbol: 'MARKET',
          assetType: 'general',
          reason: 'explore',
          title: 'Explore market opportunities',
          description: 'Browse trending assets and market insights',
          confidence: 60,
          actionType: 'explore',
          metadata: {}
        });
      }
    }

    // Cap at maximum
    const targetLimit = Math.min(
      Math.max(requestedLimit, minRecommendations),
      maxRecommendations
    );

    return recommendations.slice(0, targetLimit);
  }

  /**
   * Track when a recommendation is acted upon
   * @param {number} userId - User ID
   * @param {string} symbol - Asset symbol
   * @param {string} action - Action taken (viewed, dismissed, added_to_watchlist, purchased)
   * @param {Object} outcome - Outcome data (optional)
   * @returns {Promise<void>}
   */
  async trackRecommendationAction(userId, symbol, action, outcome = null) {
    try {
      // Store tracking data for future learning
      const trackingData = {
        userId,
        symbol,
        action,
        outcome,
        timestamp: new Date()
      };

      // Log the action
      console.log('[RecommendationService] Action tracked:', trackingData);

      // If action is 'dismiss', store it in memory to filter out
      if (action === 'dismiss') {
        if (!this.dismissedRecommendations) {
          this.dismissedRecommendations = new Map();
        }
        
        // Store dismissed recommendation with expiry (24 hours)
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
        
        if (!this.dismissedRecommendations.has(userId)) {
          this.dismissedRecommendations.set(userId, new Map());
        }
        
        this.dismissedRecommendations.get(userId).set(symbol, expiryTime);
        console.log(`[RecommendationService] Dismissed ${symbol} for user ${userId}, expiry: ${new Date(expiryTime).toISOString()}`);
        
        // Invalidate cache so next request gets filtered recommendations
        const cacheKey = `recommendations:${userId}`;
        await cacheService.delete(cacheKey);
        console.log(`[RecommendationService] Invalidated cache: ${cacheKey}`);
      }

      // Could store in database for ML training:
      // await db.query(
      //   'INSERT INTO recommendation_tracking (user_id, symbol, action, outcome, created_at) VALUES ($1, $2, $3, $4, $5)',
      //   [userId, symbol, action, JSON.stringify(outcome), new Date()]
      // );

      return trackingData;
    } catch (error) {
      console.error('[RecommendationService] Error tracking recommendation action:', error);
      // Don't throw - tracking failures shouldn't break the app
    }
  }

  /**
   * Check if a recommendation has been dismissed
   * @param {number} userId - User ID
   * @param {string} symbol - Asset symbol
   * @returns {boolean}
   */
  isRecommendationDismissed(userId, symbol) {
    if (!this.dismissedRecommendations || !this.dismissedRecommendations.has(userId)) {
      return false;
    }

    const userDismissed = this.dismissedRecommendations.get(userId);
    const expiryTime = userDismissed.get(symbol);

    if (!expiryTime) {
      return false;
    }

    // Check if dismissal has expired
    if (Date.now() > expiryTime) {
      console.log(`[RecommendationService] Dismissal expired for ${symbol}, removing from dismissed list`);
      userDismissed.delete(symbol);
      return false;
    }

    console.log(`[RecommendationService] ${symbol} is dismissed for user ${userId} (expires: ${new Date(expiryTime).toISOString()})`);
    return true;
  }
}

export default new RecommendationService();
