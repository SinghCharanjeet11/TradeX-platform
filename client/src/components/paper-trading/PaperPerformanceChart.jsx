/**
 * Paper Trading Performance Chart Component
 * Displays portfolio value over time with timeframe selector
 */

import { useState, useMemo } from 'react';
import { usePaperTradingPerformance } from '../../hooks/usePaperTradingPerformance';
import styles from './PaperPerformanceChart.module.css';

const TIMEFRAMES = [
  { value: '7d', label: '1W' },
  { value: '30d', label: '1M' },
  { value: '90d', label: '3M' },
  { value: 'all', label: 'ALL' }
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
          <svg
            viewBox="0 0 100 60"
            className={styles.chart}
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <line x1="0" y1="15" x2="100" y2="15" className={styles.gridLine} />
            <line x1="0" y1="30" x2="100" y2="30" className={styles.gridLine} />
            <line x1="0" y1="45" x2="100" y2="45" className={styles.gridLine} />

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
