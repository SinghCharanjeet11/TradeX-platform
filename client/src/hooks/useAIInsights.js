/**
 * Custom hooks for AI Insights
 */

import { useState, useEffect } from 'react';
import insightsService from '../services/insightsService';

/**
 * Hook for price predictions
 */
export const usePredictions = (symbol, assetType, timeHorizons) => {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize timeHorizons to prevent infinite re-renders
  const horizonsKey = timeHorizons?.join(',') || '24h,7d,30d';

  useEffect(() => {
    if (!symbol || !assetType) return;

    const fetchPredictions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await insightsService.getPredictions(symbol, assetType, timeHorizons);
        setPredictions(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch predictions');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [symbol, assetType, horizonsKey]);

  return { predictions, loading, error };
};

/**
 * Hook for sentiment analysis
 */
export const useSentiment = (symbol, hoursBack = 48) => {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    const fetchSentiment = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await insightsService.getSentiment(symbol, hoursBack);
        setSentiment(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch sentiment');
      } finally {
        setLoading(false);
      }
    };

    fetchSentiment();
  }, [symbol, hoursBack]);

  return { sentiment, loading, error };
};

/**
 * Hook for trading signals
 */
export const useSignals = (symbol, assetType) => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSignals = async () => {
    if (!symbol || !assetType) return;

    try {
      setLoading(true);
      setError(null);
      const data = await insightsService.getSignals(symbol, assetType);
      // Ensure signals are in chronological order (newest first)
      const sortedSignals = Array.isArray(data) 
        ? data.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
        : [];
      setSignals(sortedSignals);
    } catch (err) {
      setError(err.message || 'Failed to fetch signals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, [symbol, assetType]);

  const dismissSignal = async (signalId) => {
    try {
      await insightsService.dismissSignal(signalId);
      // Remove dismissed signal from local state
      setSignals(prev => prev.filter(signal => signal.id !== signalId));
    } catch (err) {
      console.error('Failed to dismiss signal:', err);
      throw err;
    }
  };

  return { signals, loading, error, dismissSignal, refresh: fetchSignals };
};

/**
 * Hook for technical indicators
 */
export const useTechnicalIndicators = (symbol, assetType) => {
  const [indicators, setIndicators] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol || !assetType) return;

    const fetchIndicators = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await insightsService.getTechnicalIndicators(symbol, assetType);
        setIndicators(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch indicators');
      } finally {
        setLoading(false);
      }
    };

    fetchIndicators();
  }, [symbol, assetType]);

  return { indicators, loading, error };
};

/**
 * Hook for personalized recommendations
 */
export const useRecommendations = (limit = 5, autoRefresh = false) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await insightsService.getRecommendations(limit);
      setRecommendations(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();

    // Auto-refresh every 30 minutes if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchRecommendations, 30 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [limit, autoRefresh]);

  const trackAction = async (recommendationId, action) => {
    try {
      await insightsService.trackRecommendationAction(recommendationId, action);
      // Refresh recommendations after tracking
      await fetchRecommendations();
    } catch (err) {
      console.error('Failed to track recommendation action:', err);
    }
  };

  return { recommendations, loading, error, trackAction, refresh: fetchRecommendations };
};

/**
 * Hook for portfolio optimization
 */
export const usePortfolioOptimization = () => {
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOptimization = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await insightsService.getPortfolioOptimization();
      setOptimization(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch portfolio optimization');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimization();
  }, []);

  return { optimization, loading, error, refresh: fetchOptimization };
};

/**
 * Hook for AI alerts
 */
export const useAlerts = (limit = 20, autoRefresh = false) => {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await insightsService.getAlerts(limit);
      setAlerts(data);
      setUnreadCount(data.filter(alert => !alert.read).length);
    } catch (err) {
      setError(err.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Auto-refresh every 60 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [limit, autoRefresh]);

  const markAsRead = async (alertId) => {
    try {
      await insightsService.markAlertAsRead(alertId);
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const configureAlerts = async (config) => {
    try {
      await insightsService.configureAlerts(config);
      // Refresh alerts after configuration
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to configure alerts:', err);
      throw err;
    }
  };

  return { 
    alerts, 
    unreadCount, 
    loading, 
    error, 
    markAsRead, 
    configureAlerts,
    refresh: fetchAlerts 
  };
};
