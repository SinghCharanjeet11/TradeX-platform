import { useState } from 'react';
import styles from './ResetAccountModal.module.css';

function ResetAccountModal({ account, onConfirm, onCancel }) {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm();
    }
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>⚠️ Reset Paper Trading Account</h2>
        </div>

        <div className={styles.content}>
          <p className={styles.warning}>
            This action will permanently delete all your paper trading data:
          </p>

          <div className={styles.dataList}>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Current Balance:</span>
              <span className={styles.dataValue}>
                ${account?.currentBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
              </span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Holdings:</span>
              <span className={styles.dataValue}>
                {account?.holdings?.length || 0} positions
              </span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Total Trades:</span>
              <span className={styles.dataValue}>
                {account?.totalTrades || 0} trades
              </span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Profit/Loss:</span>
              <span className={`${styles.dataValue} ${account?.totalProfitLoss >= 0 ? styles.positive : styles.negative}`}>
                ${account?.totalProfitLoss?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
              </span>
            </div>
          </div>

          <div className={styles.resetInfo}>
            <p className={styles.resetText}>
              After reset, you will receive a fresh $100,000 virtual balance.
            </p>
            <p className={styles.resetNote}>
              Note: Your order history will be preserved for learning purposes.
            </p>
          </div>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span className={styles.checkboxLabel}>
              I understand this action cannot be undone
            </span>
          </label>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={!confirmed}
          >
            Reset Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetAccountModal;
