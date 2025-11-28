/**
 * Custom hook for paper trading performance data
 * Fetches and manages performance history with auto-refresh
 */

import { useState, useEffect, useCallback } from 'react';
import paperTradingService from '../services/paperTradingService';

const REFRESH_INTERVAL = 60000; // 1 minute

export function usePaperTradingPerformance(period = '30d') {
  const [performance, setPerformance] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPerformance = useCallback(async () => {
    try {
      setError(null);
      const data = await paperTradingService.getPerformanceHistory(period);
      
      // Transform data for chart
      const chartData = data.history.map(snapshot => ({
        timestamp: new Date(snapshot.timestamp).getTime(),
        date: new Date(snapshot.timestamp).toLocaleDateString(),
        value: parseFloat(snapshot.total_value),
        balance: parseFloat(snapshot.current_balance),
        holdingsValue: parseFloat(snapshot.holdings_value)
      }));

      setPerformance(chartData);

      // Calculate metrics
      if (chartData.length > 0) {
        const firstValue = chartData[0].value;
        const lastValue = chartData[chartData.length - 1].value;
        const change = lastValue - firstValue;
        const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0;
        const maxValue = Math.max(...chartData.map(d => d.value));
        const minValue = Math.min(...chartData.map(d => d.value));

        setMetrics({
          currentValue: lastValue,
          initialValue: firstValue,
          change,
          changePercent,
          maxValue,
          minValue,
          isPositive: change >= 0
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('[usePaperTradingPerformance] Error:', err);
      setError(err.message || 'Failed to load performance data');
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchPerformance();

    // Auto-refresh
    const interval = setInterval(fetchPerformance, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchPerformance]);

  return {
    performance,
    metrics,
    loading,
    error,
    refetch: fetchPerformance
  };
}
