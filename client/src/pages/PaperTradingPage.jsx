import { useState, useEffect } from 'react';
import PracticeModeBanner from '../components/paper-trading/PracticeModeBanner';
import PaperTradingInterface from '../components/paper-trading/PaperTradingInterface';
import PaperPortfolio from '../components/paper-trading/PaperPortfolio';
import PaperTransactionHistory from '../components/paper-trading/PaperTransactionHistory';
import PaperPerformanceChart from '../components/paper-trading/PaperPerformanceChart';
import ResetAccountModal from '../components/paper-trading/ResetAccountModal';
import paperTradingService from '../services/paperTradingService';
import styles from './PaperTradingPage.module.css';

function PaperTradingPage() {
  const [account, setAccount] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadAccountData();
  }, [refreshTrigger]);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      const response = await paperTradingService.getAccount();
      if (response.success) {
        setAccount(response.data);
        setHoldings(response.data.holdings || []);
      }
    } catch (error) {
      console.error('Error loading account data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderExecuted = () => {
    // Refresh account data after order execution
    setRefreshTrigger(prev => prev + 1);
  };

  const handleResetAccount = async () => {
    try {
      const response = await paperTradingService.resetAccount();
      if (response.success) {
        setShowResetModal(false);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error resetting account:', error);
      alert('Failed to reset account. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading paper trading account...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PracticeModeBanner balance={account?.currentBalance || 100000} />
      
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Paper Trading</h1>
            <p className={styles.subtitle}>
              Practice trading with virtual money. Perfect your strategy risk-free!
            </p>
          </div>
          <button 
            className={styles.resetButton}
            onClick={() => setShowResetModal(true)}
          >
            🔄 Reset Account
          </button>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Value</span>
            <span className={styles.statValue}>
              ${(account?.totalValue || 100000).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className={styles.statChange}>
              Balance + Holdings
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Profit/Loss</span>
            <span className={`${styles.statValue} ${account?.totalProfitLoss >= 0 ? styles.positive : styles.negative}`}>
              ${account?.totalProfitLoss?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </span>
            <span className={`${styles.statChange} ${account?.profitLossPercent >= 0 ? styles.positive : styles.negative}`}>
              {account?.profitLossPercent >= 0 ? '+' : ''}{account?.profitLossPercent?.toFixed(2) || '0.00'}%
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Trades</span>
            <span className={styles.statValue}>{account?.totalTrades || 0}</span>
            <span className={styles.statChange}>
              Win Rate: {account?.winRate?.toFixed(1) || '0.0'}%
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Resets</span>
            <span className={styles.statValue}>{account?.resetCount || 0}</span>
            <span className={styles.statChange}>
              {account?.lastResetAt ? new Date(account.lastResetAt).toLocaleDateString() : 'Never'}
            </span>
          </div>
        </div>

        <div className={styles.practiceInfo}>
          <div className={styles.infoIcon}>ℹ️</div>
          <div className={styles.infoText}>
            <strong>Practice Mode Restrictions:</strong> Real exchange account connections are disabled in practice mode. 
            All trades use virtual money and simulated market conditions. Switch to real trading to connect your exchange accounts.
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.leftColumn}>
            <PaperTradingInterface 
              account={account}
              onOrderExecuted={handleOrderExecuted}
            />
          </div>
          <div className={styles.rightColumn}>
            <PaperPortfolio 
              holdings={holdings}
              account={account}
            />
          </div>
        </div>

        <div className={styles.performanceSection}>
          <PaperPerformanceChart key={refreshTrigger} />
        </div>

        <PaperTransactionHistory key={refreshTrigger} />
      </div>

      {showResetModal && (
        <ResetAccountModal
          account={account}
          onConfirm={handleResetAccount}
          onCancel={() => setShowResetModal(false)}
        />
      )}
    </div>
  );
}

export default PaperTradingPage;
