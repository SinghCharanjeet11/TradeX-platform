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
      console.log(`[usePaperTradingPerformance] Fetching performance for period: ${period}`);
      
      const data = await paperTradingService.getPerformanceHistory(period);
      console.log('[usePaperTradingPerformance] Raw API response:', data);
      
      // Check if data and history exist
      if (!data || !data.history || !Array.isArray(data.history)) {
        console.warn('[usePaperTradingPerformance] No history data available:', data);
        setPerformance([]);
        setMetrics(null);
        setLoading(false);
        return;
      }
      
      console.log(`[usePaperTradingPerformance] Processing ${data.history.length} data points`);
      
      // Transform data for chart
      const chartData = data.history.map(snapshot => ({
        timestamp: new Date(snapshot.timestamp || snapshot.date).getTime(),
        date: snapshot.date || new Date(snapshot.timestamp).toLocaleDateString(),
        value: parseFloat(snapshot.total_value || snapshot.value || 0),
        balance: parseFloat(snapshot.current_balance || 0),
        holdingsValue: parseFloat(snapshot.holdings_value || 0)
      }));

      console.log('[usePaperTradingPerformance] Transformed chart data:', chartData.slice(0, 3), '...');
      setPerformance(chartData);

      // Calculate metrics
      if (chartData.length > 0) {
        const firstValue = chartData[0].value;
        const lastValue = chartData[chartData.length - 1].value;
        const change = lastValue - firstValue;
        const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0;
        const maxValue = Math.max(...chartData.map(d => d.value));
        const minValue = Math.min(...chartData.map(d => d.value));

        const calculatedMetrics = {
          currentValue: lastValue,
          initialValue: firstValue,
          change,
          changePercent,
          maxValue,
          minValue,
          isPositive: change >= 0
        };

        console.log('[usePaperTradingPerformance] Calculated metrics:', calculatedMetrics);
        setMetrics(calculatedMetrics);
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
