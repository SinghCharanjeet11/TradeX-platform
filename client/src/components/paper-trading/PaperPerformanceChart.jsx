/**
 * Paper Trading Performance Chart Component
 * Displays portfolio value over time with timeframe selector
 */

import { useState, useMemo } from 'react';
import { usePaperTradingPerformance } from '../../hooks/usePaperTradingPerformance';
import styles from './PaperPerformanceChart.module.css';

const TIMEFRAMES = [
  { value: '1d', label: '1D' },
  { value: '5d', label: '5D' },
  { value: '30d', label: '1M' },
  { value: '180d', label: '6M' },
  { value: 'ytd', label: 'YTD' },
  { value: '365d', label: '1Y' },
  { value: '1825d', label: '5Y' },
  { value: 'all', label: 'MAX' }
];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatPercentage = (value) => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

function PaperPerformanceChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const { performance, metrics, loading, error } = usePaperTradingPerformance(selectedTimeframe);

  const chartData = useMemo(() => {
    if (!performance || performance.length === 0) return null;

    const values = performance.map(p => p.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;

    return {
      points: performance,
      minValue,
      maxValue,
      range
    };
  }, [performance]);

  const generatePath = () => {
    if (!chartData || chartData.points.length === 0) return '';

    const { points, minValue, range } = chartData;
    const width = 100;
    const height = 60;
    const padding = 5;

    // Handle case where all values are the same
    const effectiveRange = range === 0 ? 1 : range;

    const pathPoints = points.map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - padding - ((point.value - minValue) / effectiveRange) * (height - padding * 2);
      return `${x},${y}`;
    });

    return `M ${pathPoints.join(' L ')}`;
  };

  const generateYAxisLabels = () => {
    if (!chartData) return [];
    
    const { minValue, maxValue, range } = chartData;
    const labels = [];
    const steps = 5;
    
    // Handle case where all values are the same (range is 0)
    const effectiveRange = range === 0 ? 1 : range;
    
    for (let i = 0; i <= steps; i++) {
      const value = minValue + (effectiveRange / steps) * i;
      const normalizedY = range === 0 ? 0.5 : (value - minValue) / effectiveRange;
      const y = 60 - 5 - normalizedY * 50;
      labels.push({ value, y: isNaN(y) ? 30 : y });
    }
    
    return labels.reverse();
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>
            Performance
            <span className={styles.virtualBadge}>VIRTUAL</span>
          </h3>
          {metrics && (
            <div className={`${styles.change} ${metrics.isPositive ? styles.positive : styles.negative}`}>
              <span className={styles.changeValue}>
                {formatCurrency(Math.abs(metrics.change))}
              </span>
              <span className={styles.changePercent}>
                ({formatPercentage(metrics.changePercent)})
              </span>
            </div>
          )}
        </div>

        <div className={styles.timeframes}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              className={`${styles.timeframeBtn} ${
                selectedTimeframe === tf.value ? styles.active : ''
              }`}
              onClick={() => setSelectedTimeframe(tf.value)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.chartContainer}>
        {loading ? (
          <div className={styles.loading}>Loading chart...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : chartData ? (
          <div className={styles.chartWrapper}>
            <svg
              viewBox="0 0 100 60"
              className={styles.chart}
              preserveAspectRatio="none"
            >
              {/* Horizontal grid lines */}
              {generateYAxisLabels().map((label, index) => (
                <line
                  key={index}
                  x1="0"
                  y1={label.y}
                  x2="100"
                  y2={label.y}
                  className={styles.gridLine}
                />
              ))}

              {/* Area under curve */}
              <defs>
                <linearGradient id="paperChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop
                    offset="0%"
                    stopColor={metrics?.isPositive ? '#f59e0b' : '#ef4444'}
                    stopOpacity="0.3"
                  />
                  <stop
                    offset="100%"
                    stopColor={metrics?.isPositive ? '#f59e0b' : '#ef4444'}
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              <path
                d={`${generatePath()} L 100,60 L 0,60 Z`}
                fill="url(#paperChartGradient)"
              />

              {/* Line */}
              <path
                d={generatePath()}
                fill="none"
                stroke={metrics?.isPositive ? '#f59e0b' : '#ef4444'}
                strokeWidth="0.5"
                className={styles.chartLine}
              />
            </svg>
            
            {/* Y-axis labels */}
            <div className={styles.yAxisLabels}>
              {generateYAxisLabels().map((label, index) => (
                <div
                  key={index}
                  className={styles.yAxisLabel}
                  style={{ top: `${(label.y / 60) * 100}%` }}
                >
                  {formatCurrency(label.value)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            No performance data yet. Start trading to see your progress!
          </div>
        )}
      </div>

      {metrics && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Current</span>
            <span className={styles.statValue}>
              {formatCurrency(metrics.currentValue)}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>High</span>
            <span className={styles.statValue}>
              {formatCurrency(metrics.maxValue)}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Low</span>
            <span className={styles.statValue}>
              {formatCurrency(metrics.minValue)}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Initial</span>
            <span className={styles.statValue}>
              {formatCurrency(metrics.initialValue)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaperPerformanceChart;
