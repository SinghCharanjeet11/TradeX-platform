import { useState } from 'react';
import paperTradingService from '../../services/paperTradingService';
import TradingTooltip from './TradingTooltip';
import styles from './PaperTradingInterface.module.css';

function PaperTradingInterface({ account, onOrderExecuted }) {
  const [orderType, setOrderType] = useState('buy');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('crypto');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!symbol || !name || !quantity || !price) {
      setError('Please fill in all fields');
      return;
    }

    const qty = parseFloat(quantity);
    const prc = parseFloat(price);

    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive number');
      return;
    }

    if (isNaN(prc) || prc <= 0) {
      setError('Price must be a positive number');
      return;
    }

    const totalCost = qty * prc;

    if (orderType === 'buy' && totalCost > account?.currentBalance) {
      setError(`Insufficient balance. Required: $${totalCost.toFixed(2)}, Available: $${account.currentBalance.toFixed(2)}`);
      return;
    }

    try {
      setLoading(true);
      const response = await paperTradingService.executePaperOrder({
        symbol: symbol.toUpperCase(),
        name,
        assetType,
        orderType,
        quantity: qty,
        price: prc
      });

      if (response.success) {
        setSuccess(`${orderType === 'buy' ? 'Bought' : 'Sold'} ${qty} ${symbol.toUpperCase()} at $${prc.toFixed(2)}`);
        // Reset form
        setSymbol('');
        setName('');
        setQuantity('');
        setPrice('');
        // Notify parent
        if (onOrderExecuted) {
          onOrderExecuted();
        }
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to execute order');
    } finally {
      setLoading(false);
    }
  };

  const totalValue = quantity && price ? (parseFloat(quantity) * parseFloat(price)).toFixed(2) : '0.00';

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Place Order</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.orderTypeToggle}>
          <button
            type="button"
            className={`${styles.toggleButton} ${orderType === 'buy' ? styles.active : ''}`}
            onClick={() => setOrderType('buy')}
          >
            Buy
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${orderType === 'sell' ? styles.active : ''}`}
            onClick={() => setOrderType('sell')}
          >
            Sell
          </button>
        </div>

        <div className={styles.formGroup}>
          <TradingTooltip concept="assetTypes">
            <label className={styles.label}>Asset Type</label>
          </TradingTooltip>
          <select
            className={styles.select}
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
          >
            <option value="crypto">Cryptocurrency</option>
            <option value="stocks">Stocks</option>
            <option value="forex">Forex</option>
            <option value="commodities">Commodities</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Symbol</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g., BTC, AAPL, EUR/USD"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Name</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g., Bitcoin, Apple Inc."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <TradingTooltip concept="quantity">
            <label className={styles.label}>Quantity</label>
          </TradingTooltip>
          <input
            type="number"
            step="any"
            className={styles.input}
            placeholder="0.00"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <TradingTooltip concept="marketPrice">
            <label className={styles.label}>Price (USD)</label>
          </TradingTooltip>
          <input
            type="number"
            step="any"
            className={styles.input}
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className={styles.totalValue}>
          <TradingTooltip concept="totalCost">
            <span className={styles.totalLabel}>Total Value:</span>
          </TradingTooltip>
          <span className={styles.totalAmount}>${totalValue}</span>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <button
          type="submit"
          className={`${styles.submitButton} ${orderType === 'buy' ? styles.buyButton : styles.sellButton}`}
          disabled={loading}
        >
          {loading ? 'Processing...' : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${symbol.toUpperCase() || 'Asset'}`}
        </button>

        <div className={styles.virtualNote}>
          💡 This is virtual money. Practice without risk!
        </div>
      </form>
    </div>
  );
}

export default PaperTradingInterface;
