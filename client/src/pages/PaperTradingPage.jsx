import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PracticeModeBanner from '../components/paper-trading/PracticeModeBanner';
import PaperTradingInterface from '../components/paper-trading/PaperTradingInterface';
import PaperPortfolio from '../components/paper-trading/PaperPortfolio';
import PaperTransactionHistory from '../components/paper-trading/PaperTransactionHistory';
import PaperPerformanceChart from '../components/paper-trading/PaperPerformanceChart';
import ResetAccountModal from '../components/paper-trading/ResetAccountModal';
import paperTradingService from '../services/paperTradingService';
import styles from './PaperTradingPage.module.css';

function PaperTradingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [account, setAccount] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/signin', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    loadAccountData();
  }, [refreshTrigger]);

  const loadAccountData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      console.log('[PaperTradingPage] Loading account data...');
      const response = await paperTradingService.getAccount();
      console.log('[PaperTradingPage] Account response:', response);
      
      if (response.success) {
        setAccount(response.data);
        const holdingsData = response.data.holdings || [];
        console.log('[PaperTradingPage] Holdings data:', holdingsData);
        console.log('[PaperTradingPage] Current Balance:', response.data.currentBalance);
        console.log('[PaperTradingPage] Total Value:', response.data.totalValue);
        setHoldings(holdingsData);
      } else {
        console.error('[PaperTradingPage] Failed to load account:', response);
      }
    } catch (error) {
      console.error('[PaperTradingPage] Error loading account data:', error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleOrderExecuted = async () => {
    // Immediately refresh account data after order execution
    console.log('[PaperTradingPage] Order executed, refreshing account data...');
    await loadAccountData(true);
    // Also trigger refresh for child components
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

  if (authLoading || loading) {
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
            <h1 className={styles.title}>
              Paper Trading
              {refreshing && <span className={styles.refreshIndicator}> 🔄 Updating...</span>}
            </h1>
            <p className={styles.subtitle}>
              Practice trading with virtual money. Perfect your strategy risk-free!
            </p>
          </div>
          <div className={styles.headerButtons}>
            <button 
              className={styles.refreshButton}
              onClick={() => loadAccountData(true)}
              disabled={refreshing}
              title="Refresh account data"
            >
              🔄 Refresh
            </button>
            <button 
              className={styles.resetButton}
              onClick={() => setShowResetModal(true)}
            >
              🔄 Reset Account
            </button>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Value</span>
            <span className={styles.statValue}>
              ${Number(account?.totalValue || 100000).toFixed(2)}
            </span>
            <span className={styles.statChange}>
              Balance + Holdings
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total P/L</span>
            <span className={`${styles.statValue} ${(account?.totalProfitLoss || 0) >= 0 ? styles.positive : styles.negative}`}>
              ${Number(account?.totalProfitLoss || 0).toFixed(2)}
            </span>
            <span className={`${styles.statChange} ${(account?.profitLossPercent || 0) >= 0 ? styles.positive : styles.negative}`}>
              {(account?.profitLossPercent || 0) >= 0 ? '+' : ''}{Number(account?.profitLossPercent || 0).toFixed(2)}%
              {account?.realizedProfitLoss !== undefined && account?.unrealizedProfitLoss !== undefined && (
                <span style={{ fontSize: '0.75em', display: 'block', marginTop: '2px', opacity: 0.8 }}>
                  Realized: ${Number(account.realizedProfitLoss).toFixed(2)} | Unrealized: ${Number(account.unrealizedProfitLoss).toFixed(2)}
                </span>
              )}
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
