import { useState } from 'react';
import styles from './TradingTooltip.module.css';

const TOOLTIP_CONTENT = {
  orderTypes: {
    title: 'Order Types',
    content: 'Market orders execute immediately at current price. Limit orders execute only at your specified price or better.',
    link: null
  },
  marketPrice: {
    title: 'Market Price',
    content: 'The current price at which an asset is trading. This is the price you\'ll pay for a market order.',
    link: null
  },
  quantity: {
    title: 'Quantity',
    content: 'The number of units you want to buy or sell. Your total cost will be quantity × price.',
    link: null
  },
  totalCost: {
    title: 'Total Cost',
    content: 'The total amount you\'ll spend (for buys) or receive (for sells). Calculated as quantity × price.',
    link: null
  },
  roi: {
    title: 'Return on Investment (ROI)',
    content: 'The percentage gain or loss on your investment. Calculated as (Current Value - Cost) / Cost × 100%.',
    link: null
  },
  profitLoss: {
    title: 'Profit/Loss',
    content: 'The dollar amount you\'ve gained or lost on a position. Green means profit, red means loss.',
    link: null
  },
  diversification: {
    title: 'Diversification',
    content: 'Spreading investments across different assets to reduce risk. Don\'t put all your eggs in one basket!',
    link: null
  },
  balance: {
    title: 'Available Balance',
    content: 'The amount of virtual cash you have available to make new purchases. This doesn\'t include the value of your holdings.',
    link: null
  },
  portfolioValue: {
    title: 'Portfolio Value',
    content: 'The total current value of all your holdings. This changes as market prices fluctuate.',
    link: null
  },
  totalValue: {
    title: 'Total Value',
    content: 'Your available balance plus the value of all your holdings. This is your total account value.',
    link: null
  },
  winRate: {
    title: 'Win Rate',
    content: 'The percentage of your trades that were profitable. A higher win rate indicates better trading decisions.',
    link: null
  },
  avgBuyPrice: {
    title: 'Average Buy Price',
    content: 'The average price you paid for this asset across all purchases. Used to calculate profit/loss.',
    link: null
  },
  assetTypes: {
    title: 'Asset Types',
    content: 'Different categories of tradeable assets: Crypto (Bitcoin, Ethereum), Stocks (Apple, Tesla), Forex (EUR/USD), and Commodities (Gold, Oil).',
    link: null
  }
};

function TradingTooltip({ concept, children, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipData = TOOLTIP_CONTENT[concept];

  if (!tooltipData) {
    return <>{children}</>;
  }

  return (
    <div className={styles.container}>
      <div
        className={styles.trigger}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        {children}
        <span className={styles.icon}>ⓘ</span>
      </div>
      
      {isVisible && (
        <div className={`${styles.tooltip} ${styles[position]}`}>
          <div className={styles.tooltipHeader}>
            <h4 className={styles.tooltipTitle}>{tooltipData.title}</h4>
            <button
              className={styles.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
              }}
            >
              ×
            </button>
          </div>
          <p className={styles.tooltipContent}>{tooltipData.content}</p>
          {tooltipData.link && (
            <a
              href={tooltipData.link}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.tooltipLink}
            >
              Learn more →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default TradingTooltip;
