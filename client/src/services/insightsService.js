/**
 * AI Insights Service
 * Handles API calls for AI-powered insights
 */

import api from './api';

const insightsService = {
  /**
   * Get price predictions for an asset
   */
  async getPredictions(symbol, assetType, timeHorizons = ['24h', '7d', '30d']) {
    try {
      const horizonsParam = timeHorizons.join(',');
      // URL encode symbol to handle forex pairs like EUR/USD
      const encodedSymbol = encodeURIComponent(symbol);
      const response = await api.get(
        `/insights/predictions/${encodedSymbol}?assetType=${assetType}&timeHorizons=${horizonsParam}`
      );
      // Fix: API returns response.data.data
      const data = response.data?.data || response.data;
      // If there's an error in the data, return with empty predictions
      if (data?.error) {
        return {
          ...data,
          predictions: []
        };
      }
      return data;
    } catch (error) {
      console.error('Error fetching predictions:', error);
      // Return fallback data instead of throwing
      return {
        symbol,
        assetType,
        predictions: [],
        error: { message: 'Unable to load predictions' }
      };
    }
  },

  /**
   * Get sentiment analysis for an asset
   */
  async getSentiment(symbol, hoursBack = 48) {
    try {
      // URL encode symbol to handle forex pairs like EUR/USD
      const encodedSymbol = encodeURIComponent(symbol);
      const response = await api.get(
        `/insights/sentiment/${encodedSymbol}?hoursBack=${hoursBack}`
      );
      // Fix: API returns response.data.data
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error fetching sentiment:', error);
      // Return fallback data
      return {
        symbol,
        sentimentScore: 0,
        sentiment: 'neutral',
        trend: 'stable',
        articlesAnalyzed: 0,
        topArticles: [],
        error: { message: 'Unable to load sentiment' }
      };
    }
  },

  /**
   * Get trading signals for an asset
   */
  async getSignals(symbol, assetType) {
    try {
      // URL encode symbol to handle forex pairs like EUR/USD
      const encodedSymbol = encodeURIComponent(symbol);
      const response = await api.get(
        `/insights/signals/${encodedSymbol}?assetType=${assetType}`
      );
      // Fix: API returns response.data.data
      const data = response.data?.data || response.data;
      // Ensure it's an array and filter out signals with errors or zero confidence
      const signals = Array.isArray(data) ? data : [data];
      return signals.filter(s => !s.error && s.confidence > 0);
    } catch (error) {
      console.error('Error fetching signals:', error);
      // Return empty array as fallback
      return [];
    }
  },

  /**
   * Dismiss a trading signal
   */
  async dismissSignal(signalId) {
    try {
      const response = await api.post(`/insights/signals/${signalId}/dismiss`);
      return response.data;
    } catch (error) {
      console.error('Error dismissing signal:', error);
      throw error;
    }
  },

  /**
   * Get technical indicators for an asset
   */
  async getTechnicalIndicators(symbol, assetType) {
    try {
      // URL encode symbol to handle forex pairs like EUR/USD
      const encodedSymbol = encodeURIComponent(symbol);
      const response = await api.get(
        `/insights/technical/${encodedSymbol}?assetType=${assetType}`
      );
      // Fix: API returns response.data.data
      const data = response.data?.data || response.data;
      // If there's an error in the data, return with empty indicators
      if (data?.error) {
        return {
          ...data,
          indicators: []
        };
      }
      return data;
    } catch (error) {
      console.error('Error fetching technical indicators:', error);
      // Return fallback data
      return {
        symbol,
        indicators: [],
        error: { message: 'Unable to load indicators' }
      };
    }
  },

  /**
   * Get personalized recommendations
   */
  async getRecommendations(limit = 5) {
    try {
      const response = await api.get(`/insights/recommendations?limit=${limit}`);
      // Fix: API returns response.data.data
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  },

  /**
   * Track recommendation action (view/dismiss)
   */
  async trackRecommendationAction(recommendationId, action) {
    try {
      const response = await api.post(`/insights/recommendations/${recommendationId}/track`, {
        action
      });
      return response.data;
    } catch (error) {
      console.error('Error tracking recommendation action:', error);
      // Don't throw - tracking failures shouldn't break the app
      return { success: false };
    }
  },

  /**
   * Get portfolio optimization suggestions
   */
  async getPortfolioOptimization() {
    try {
      const response = await api.get('/insights/portfolio-optimization');
      // Fix: API returns response.data.data
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error fetching portfolio optimization:', error);
      // Return fallback data instead of throwing
      return {
        isOptimized: true,
        message: 'Unable to load optimization at this time.',
        currentAllocation: {},
        recommendedAllocation: {},
        suggestions: [],
        trades: []
      };
    }
  },

  /**
   * Get AI-generated alerts
   */
  async getAlerts(limit = 20) {
    try {
      const response = await api.get(`/insights/alerts?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },

  /**
   * Configure alert preferences
   */
  async configureAlerts(config) {
    try {
      const response = await api.post('/insights/alerts/configure', config);
      return response.data;
    } catch (error) {
      console.error('Error configuring alerts:', error);
      throw error;
    }
  },

  /**
   * Mark alert as read
   */
  async markAlertAsRead(alertId) {
    try {
      const response = await api.post(`/insights/alerts/${alertId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  },

  /**
   * Get alert configuration
   */
  async getAlertConfig() {
    try {
      const response = await api.get('/insights/alerts/config');
      return response.data;
    } catch (error) {
      console.error('Error fetching alert config:', error);
      throw error;
    }
  }
};

export default insightsService;
