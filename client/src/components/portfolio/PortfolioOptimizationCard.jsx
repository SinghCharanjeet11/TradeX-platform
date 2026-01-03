import { useState, useEffect } from 'react';
import { MdAutoFixHigh, MdRefresh, MdTrendingUp, MdCheckCircle } from 'react-icons/md';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import insightsService from '../../services/insightsService';
import styles from './PortfolioOptimizationCard.module.css';

function PortfolioOptimizationCard() {
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const COLORS = {
    crypto: '#f59e0b',
    stocks: '#3b82f6',
    forex: '#8b5cf6',
    commodities: '#10b981'
  };

  const fetchOptimization = async () => {
    try {
      setError(null);
      const data = await insightsService.getPortfolioOptimization();
      setOptimization(data);
    } catch (err) {
      console.error('Error fetching portfolio optimization:', err);
      setError('Failed to load optimization suggestions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOptimization();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOptimization();
  };

  const formatAllocation = (allocation) => {
    if (!allocation) return [];
    return Object.entries(allocation).map(([assetType, percentage]) => ({
      name: assetType.charAt(0).toUpperCase() + assetType.slice(1),
      value: percentage,
      assetType
    }));
  };

  const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
      <div className={styles.legendContainer}>
        {payload.map((entry, index) => (
          <div key={`legend-${index}`} className={styles.legendItem}>
            <div 
              className={styles.legendColor} 
              style={{ backgroundColor: entry.color }}
            />
            <span className={styles.legendText}>{entry.value}</span>
            <span className={styles.legendPercent}>{entry.payload.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <MdAutoFixHigh className={styles.headerIcon} />
            <h3>Portfolio Optimization</h3>
          </div>
        </div>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Analyzing your portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <MdAutoFixHigh className={styles.headerIcon} />
            <h3>Portfolio Optimization</h3>
          </div>
          <button 
            className={styles.refreshBtn} 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <MdRefresh className={refreshing ? styles.spinning : ''} />
          </button>
        </div>
        <div className={styles.error}>
          <p>{error}</p>
          <button className={styles.retryBtn} onClick={handleRefresh}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Check if portfolio is well-optimized
  const isWellOptimized = optimization?.isOptimized || false;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <MdAutoFixHigh className={styles.headerIcon} />
          <h3>Portfolio Optimization</h3>
          {isWellOptimized && (
            <span className={styles.badge}>
              <MdCheckCircle /> Optimized
            </span>
          )}
        </div>
        <div className={styles.headerRight}>
          <button 
            className={styles.refreshBtn} 
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh optimization"
          >
            <MdRefresh className={refreshing ? styles.spinning : ''} />
          </button>
          <button 
            className={styles.toggleBtn}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {isWellOptimized ? (
            <div className={styles.wellOptimized}>
              <MdCheckCircle className={styles.checkIcon} />
              <h4>Portfolio is Well-Optimized</h4>
              <p>Your current allocation is well-balanced and diversified. No changes recommended at this time.</p>
            </div>
          ) : (
            <>
              {/* Allocation Comparison */}
              <div className={styles.comparisonSection}>
                <div className={styles.allocationColumn}>
                  <h4>Current Allocation</h4>
                  <div className={styles.chartContainer}>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={formatAllocation(optimization?.currentAllocation)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {formatAllocation(optimization?.currentAllocation).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.assetType] || '#6b7280'} />
                          ))}
                        </Pie>
                        <Legend content={renderCustomLegend} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={styles.arrow}>→</div>

                <div className={styles.allocationColumn}>
                  <h4>Recommended Allocation</h4>
                  <div className={styles.chartContainer}>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={formatAllocation(optimization?.recommendedAllocation)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {formatAllocation(optimization?.recommendedAllocation).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.assetType] || '#6b7280'} />
                          ))}
                        </Pie>
                        <Legend content={renderCustomLegend} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Optimization Suggestions */}
              {optimization?.suggestions && optimization.suggestions.length > 0 && (
                <div className={styles.suggestionsSection}>
                  <h4>Optimization Suggestions</h4>
                  <div className={styles.suggestionsList}>
                    {optimization.suggestions.map((suggestion, index) => (
                      <div key={index} className={styles.suggestionItem}>
                        <MdTrendingUp className={styles.suggestionIcon} />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trade Recommendations */}
              {optimization?.trades && optimization.trades.length > 0 && (
                <div className={styles.tradesSection}>
                  <h4>Recommended Trades</h4>
                  <div className={styles.tradesList}>
                    {optimization.trades.map((trade, index) => (
                      <div key={index} className={styles.tradeItem}>
                        <div className={styles.tradeHeader}>
                          <span className={`${styles.tradeAction} ${styles[trade.action.toLowerCase()]}`}>
                            {trade.action}
                          </span>
                          <span className={styles.tradeSymbol}>{trade.symbol}</span>
                        </div>
                        <div className={styles.tradeDetails}>
                          <span className={styles.tradeAmount}>
                            {trade.amount} {trade.assetType}
                          </span>
                          {trade.reason && (
                            <span className={styles.tradeReason}>{trade.reason}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply Button (Future Feature) */}
              <div className={styles.footer}>
                <button className={styles.applyBtn} disabled title="Coming soon">
                  Apply Optimization
                </button>
                <span className={styles.footerNote}>
                  Review recommendations carefully before making changes
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default PortfolioOptimizationCard;
