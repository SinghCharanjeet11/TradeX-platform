import TradingTooltip from './TradingTooltip';
import styles from './PaperPortfolio.module.css';

function PaperPortfolio({ holdings, account }) {
  const totalPortfolioValue = holdings.reduce((sum, h) => {
    return sum + (h.quantity * (h.currentPrice || h.avgBuyPrice));
  }, 0);

  const totalProfitLoss = holdings.reduce((sum, h) => {
    return sum + (h.quantity * ((h.currentPrice || h.avgBuyPrice) - h.avgBuyPrice));
  }, 0);

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
              ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <TradingTooltip concept="profitLoss">
              <span className={styles.summaryLabel}>Total P/L:</span>
            </TradingTooltip>
            <span className={`${styles.summaryValue} ${totalProfitLoss >= 0 ? styles.positive : styles.negative}`}>
              ${totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {holdings.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📊</span>
          <p className={styles.emptyText}>No holdings yet</p>
          <p className={styles.emptySubtext}>Place your first order to start building your virtual portfolio</p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div className={styles.col1}>Asset</div>
            <div className={styles.col2}>Quantity</div>
            <div className={styles.col3}>
              <TradingTooltip concept="avgBuyPrice">
                <span>Avg Price</span>
              </TradingTooltip>
            </div>
            <div className={styles.col4}>
              <TradingTooltip concept="marketPrice">
                <span>Current</span>
              </TradingTooltip>
            </div>
            <div className={styles.col5}>Value</div>
            <div className={styles.col6}>
              <TradingTooltip concept="roi">
                <span>P/L</span>
              </TradingTooltip>
            </div>
          </div>
          <div className={styles.tableBody}>
            {holdings.map((holding) => {
              const currentPrice = holding.currentPrice || holding.avgBuyPrice;
              const totalValue = holding.quantity * currentPrice;
              const profitLoss = holding.quantity * (currentPrice - holding.avgBuyPrice);
              const profitLossPercent = holding.avgBuyPrice > 0
                ? ((currentPrice - holding.avgBuyPrice) / holding.avgBuyPrice) * 100
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
                    {holding.quantity.toLocaleString('en-US', { maximumFractionDigits: 8 })}
                  </div>
                  <div className={styles.col3}>
                    ${holding.avgBuyPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className={styles.col4}>
                    ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className={styles.col5}>
                    ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className={styles.col6}>
                    <div className={profitLoss >= 0 ? styles.positive : styles.negative}>
                      <div>${profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
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
      )}
    </div>
  );
}

export default PaperPortfolio;
