import TradingTooltip from './TradingTooltip';
import styles from './PaperPortfolio.module.css';

function PaperPortfolio({ holdings, account }) {
  console.log('[PaperPortfolio] Rendering with holdings:', holdings);
  console.log('[PaperPortfolio] Account:', account);
  
  // Helper function to format prices with appropriate decimal places
  const formatPrice = (value) => {
    const num = parseFloat(value) || 0;
    if (num === 0) return '0.00';
    if (num < 0.01) return num.toFixed(8).replace(/\.?0+$/, '');
    if (num < 1) return num.toFixed(6).replace(/\.?0+$/, '');
    if (num < 100) return num.toFixed(4).replace(/\.?0+$/, '');
    return num.toFixed(2);
  };
  
  // Filter out holdings with 0 or invalid quantity
  const validHoldings = holdings.filter(h => {
    const quantity = parseFloat(h.quantity) || 0;
    return quantity > 0;
  });
  
  console.log('[PaperPortfolio] Valid holdings (quantity > 0):', validHoldings.length, 'of', holdings.length);
  
  const totalPortfolioValue = validHoldings.reduce((sum, h) => {
    const quantity = parseFloat(h.quantity) || 0;
    const currentPrice = parseFloat(h.currentPrice) || parseFloat(h.avgBuyPrice) || 0;
    console.log('[PaperPortfolio] Calculating value for', h.symbol, ':', { quantity, currentPrice, value: quantity * currentPrice });
    return sum + (quantity * currentPrice);
  }, 0);

  const totalProfitLoss = validHoldings.reduce((sum, h) => {
    const quantity = parseFloat(h.quantity) || 0;
    const currentPrice = parseFloat(h.currentPrice) || parseFloat(h.avgBuyPrice) || 0;
    const avgBuyPrice = parseFloat(h.avgBuyPrice) || 0;
    return sum + (quantity * (currentPrice - avgBuyPrice));
  }, 0);

  console.log('[PaperPortfolio] Total portfolio value:', totalPortfolioValue);
  console.log('[PaperPortfolio] Total P/L:', totalProfitLoss);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Virtual Portfolio</h2>
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <TradingTooltip concept="portfolioValue">
              <span className={styles.summaryLabel}>Portfolio Value:</span>
            </TradingTooltip>
            <span className={styles.summaryValue}>
              ${Number(totalPortfolioValue).toFixed(2)}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <TradingTooltip concept="profitLoss">
              <span className={styles.summaryLabel}>Total P/L:</span>
            </TradingTooltip>
            <span className={`${styles.summaryValue} ${totalProfitLoss >= 0 ? styles.positive : styles.negative}`}>
              ${Number(totalProfitLoss).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {validHoldings.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📊</span>
          <p className={styles.emptyText}>No holdings yet</p>
          <p className={styles.emptySubtext}>Place your first order to start building your virtual portfolio</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.col1}>Asset</div>
              <div className={styles.col2}>Quantity</div>
              <div className={styles.col3}>
                <TradingTooltip concept="marketPrice">
                  <span>Current</span>
                </TradingTooltip>
              </div>
              <div className={styles.col4}>Value</div>
              <div className={styles.col5}>
                <TradingTooltip concept="roi">
                  <span>P/L</span>
                </TradingTooltip>
              </div>
            </div>
            <div className={styles.tableBody}>
              {validHoldings.map((holding) => {
                const quantity = parseFloat(holding.quantity) || 0;
                const avgBuyPrice = parseFloat(holding.avgBuyPrice) || 0;
                const currentPrice = parseFloat(holding.currentPrice) || avgBuyPrice;
                const totalValue = quantity * currentPrice;
                const profitLoss = quantity * (currentPrice - avgBuyPrice);
                const profitLossPercent = avgBuyPrice > 0
                  ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100
                  : 0;

                return (
                  <div key={holding.id} className={styles.tableRow}>
                    <div className={styles.col1}>
                      <div className={styles.assetInfo}>
                        <span className={styles.symbol}>{holding.symbol}</span>
                        <span className={styles.name}>{holding.name}</span>
                        <span className={styles.virtualBadge}>VIRTUAL</span>
                      </div>
                    </div>
                    <div className={styles.col2}>
                      {quantity.toLocaleString('en-US', { maximumFractionDigits: 8 })}
                    </div>
                    <div className={styles.col3}>
                      ${formatPrice(currentPrice)}
                    </div>
                    <div className={styles.col4}>
                      ${formatPrice(totalValue)}
                    </div>
                    <div className={styles.col5}>
                      <div className={profitLoss >= 0 ? styles.positive : styles.negative}>
                        <div>${profitLoss.toFixed(2)}</div>
                        <div className={styles.percent}>
                          {profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaperPortfolio;
