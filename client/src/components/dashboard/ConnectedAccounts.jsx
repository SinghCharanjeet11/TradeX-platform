import { useState } from 'react'
import { MdLink, MdDelete, MdRefresh, MdCheckCircle, MdAdd } from 'react-icons/md'
import { SiBinance } from 'react-icons/si'
import styles from './ConnectedAccounts.module.css'

const PLATFORM_ICONS = {
  binance: SiBinance
}

function ConnectedAccounts({ accounts, onDisconnect, onRefresh, onConnectNew }) {
  const [refreshing, setRefreshing] = useState({})

  const handleRefresh = async (accountId) => {
    setRefreshing(prev => ({ ...prev, [accountId]: true }))
    await onRefresh(accountId)
    setTimeout(() => {
      setRefreshing(prev => ({ ...prev, [accountId]: false }))
    }, 1000)
  }

  if (!accounts || accounts.length === 0) {
    return null
  }

  return (
    <div className={styles.connectedAccounts}>
      <div className={styles.header}>
        <h3>
          <MdLink /> Connected Accounts
        </h3>
        <div className={styles.headerActions}>
          <span className={styles.badge}>{accounts.length}</span>
          <button className={styles.connectBtn} onClick={onConnectNew}>
            <MdAdd /> Connect
          </button>
        </div>
      </div>

      <div className={styles.accountsList}>
        {accounts.map((account) => {
          const Icon = PLATFORM_ICONS[account.platform] || MdLink
          return (
            <div key={account.id} className={styles.accountCard}>
              <div className={styles.accountIcon}>
                <Icon />
              </div>
              <div className={styles.accountInfo}>
                <div className={styles.accountHeader}>
                  <h4>{account.name || account.platform}</h4>
                  <span className={styles.statusBadge}>
                    <MdCheckCircle /> {account.status || 'Connected'}
                  </span>
                </div>
                <p className={styles.accountDetails}>
                  Last synced: {account.lastSync ? new Date(account.lastSync).toLocaleString() : 'Just now'}
                </p>
                {account.portfolio && (
                  <div className={styles.portfolioPreview}>
                    <span>Portfolio Value: ${account.portfolio.totalValue?.toLocaleString() || '0'}</span>
                    <span className={account.portfolio.change24h >= 0 ? styles.positive : styles.negative}>
                      {account.portfolio.change24h >= 0 ? '+' : ''}{account.portfolio.change24h?.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
              <div className={styles.accountActions}>
                <button
                  className={styles.refreshBtn}
                  onClick={() => handleRefresh(account.id)}
                  disabled={refreshing[account.id]}
                  title="Refresh data"
                >
                  <MdRefresh className={refreshing[account.id] ? styles.spinning : ''} />
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to disconnect ${account.name || account.platform}?`)) {
                      onDisconnect(account.platform)
                    }
                  }}
                  title="Disconnect account"
                >
                  <MdDelete />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ConnectedAccounts
