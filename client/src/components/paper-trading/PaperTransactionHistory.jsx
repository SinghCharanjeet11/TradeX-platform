import { useState, useEffect } from 'react';
import paperTradingService from '../../services/paperTradingService';
import styles from './PaperTransactionHistory.module.css';

function PaperTransactionHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    assetType: 'all',
    transactionType: 'all',
    dateRange: 'all'
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await paperTradingService.getOrders();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching paper trading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `$${Number(amount || 0).toFixed(2)}`;
  };

  const calculateProfitLoss = (order) => {
    // For closed positions, calculate P/L
    // This is a simplified calculation - in reality, you'd need to match buy/sell pairs
    if (order.status === 'filled' && order.side === 'sell') {
      // Placeholder - would need actual cost basis
      return order.total * 0.1; // Example: 10% profit
    }
    return null;
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by asset type
    if (filters.assetType !== 'all') {
      filtered = filtered.filter(order => 
        order.assetType?.toLowerCase() === filters.assetType.toLowerCase()
      );
    }

    // Filter by transaction type
    if (filters.transactionType !== 'all') {
      filtered = filtered.filter(order => 
        order.side?.toLowerCase() === filters.transactionType.toLowerCase()
      );
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case '1d':
          cutoffDate.setDate(now.getDate() - 1);
          break;
        case '1w':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '1m':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case '3m':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case '1y':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(order => 
        new Date(order.createdAt) >= cutoffDate
      );
    }

    // Sort by date descending (most recent first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return filtered;
  };

  const filteredOrders = filterOrders();

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading transaction history...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Transaction History</h2>
        <span className={styles.virtualBadge}>VIRTUAL</span>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="assetType">Asset Type:</label>
          <select
            id="assetType"
            value={filters.assetType}
            onChange={(e) => setFilters({ ...filters, assetType: e.target.value })}
            className={styles.filterSelect}
          >
            <option value="all">All Assets</option>
            <option value="crypto">Crypto</option>
            <option value="stocks">Stocks</option>
            <option value="forex">Forex</option>
            <option value="commodities">Commodities</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="transactionType">Type:</label>
          <select
            id="transactionType"
            value={filters.transactionType}
            onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
            className={styles.filterSelect}
          >
            <option value="all">All Transactions</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="dateRange">Date Range:</label>
          <select
            id="dateRange"
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className={styles.filterSelect}
          >
            <option value="all">All Time</option>
            <option value="1d">Last 24 Hours</option>
            <option value="1w">Last Week</option>
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No transactions found</p>
          <p className={styles.emptyHint}>
            {orders.length === 0 
              ? 'Start trading to see your transaction history here'
              : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Asset</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className={styles.row}>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{formatTime(order.createdAt)}</td>
                  <td>
                    <div className={styles.assetCell}>
                      <span className={styles.symbol}>{order.symbol}</span>
                      <span className={styles.assetType}>{order.assetType}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.typeBadge} ${styles[order.side]}`}>
                      {order.side?.toUpperCase()}
                    </span>
                  </td>
                  <td>{order.quantity}</td>
                  <td>{formatCurrency(order.price)}</td>
                  <td>
                    <span className={styles.virtualAmount}>
                      {formatCurrency(order.total || (order.quantity * order.price))}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.summary}>
        <p>Showing {filteredOrders.length} of {orders.length} transactions</p>
      </div>
    </div>
  );
}

export default PaperTransactionHistory;
