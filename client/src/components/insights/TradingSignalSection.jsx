import { useSignals } from '../../hooks/useAIInsights'
import { MdTrendingUp, MdTrendingDown, MdRemoveCircleOutline, MdClose, MdCheckCircle } from 'react-icons/md'
import styles from './TradingSignalSection.module.css'

function TradingSignalSection({ symbol, assetType, currentPrice }) {
  const { signals, loading, error, dismissSignal } = useSignals(symbol, assetType)

  if (loading) {
    return (
      <div className={styles.section}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading trading signals...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.error}>
          <MdRemoveCircleOutline className={styles.errorIcon} />
          <p>Unable to load signals</p>
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!signals || signals.length === 0) {
    return (
      <div className={styles.section}>
        <div className={styles.noData}>
          <MdCheckCircle className={styles.noDataIcon} />
          <p>No active trading signals</p>
          <span>Check back later for new opportunities</span>
        </div>
      </div>
    )
  }

  const getSignalIcon = (signalType) => {
    if (signalType === 'BUY') return <MdTrendingUp />
    if (signalType === 'SELL') return <MdTrendingDown />
    return <MdRemoveCircleOutline />
  }

  const handleDismiss = async (signalId) => {
    try {
      await dismissSignal(signalId)
    } catch (err) {
      console.error('Error dismissing signal:', err)
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <MdTrendingUp className={styles.headerIcon} />
        <h3>Trading Signals</h3>
      </div>

      <div className={styles.signalsList}>
        {signals.map((signal) => (
          <div key={signal.id} className={`${styles.signalCard} ${styles[signal.signalType.toLowerCase()]}`}>
            {/* Signal Header */}
            <div className={styles.signalHeader}>
              <div className={styles.signalType}>
                <div className={`${styles.signalBadge} ${styles[signal.signalType.toLowerCase()]}`}>
                  {getSignalIcon(signal.signalType)}
                  <span>{signal.signalType}</span>
                </div>
                <span className={styles.timestamp}>
                  {new Date(signal.generatedAt).toLocaleDateString()}
                </span>
              </div>
              <button 
                className={styles.dismissBtn}
                onClick={() => handleDismiss(signal.id)}
                title="Dismiss signal"
              >
                <MdClose />
              </button>
            </div>

            {/* Confidence Level */}
            <div className={styles.confidence}>
              <div className={styles.confidenceLabel}>
                <span>Confidence</span>
                <span className={styles.confidenceValue}>{signal.confidence}%</span>
              </div>
              <div className={styles.confidenceBar}>
                <div 
                  className={styles.confidenceFill}
                  style={{ 
                    width: `${signal.confidence}%`,
                    backgroundColor: signal.confidence >= 70 ? '#10b981' : signal.confidence >= 50 ? '#f59e0b' : '#ef4444'
                  }}
                ></div>
              </div>
            </div>

            {/* Price Targets */}
            <div className={styles.priceTargets}>
              <h4>Price Targets</h4>
              <div className={styles.targetsGrid}>
                <div className={styles.targetItem}>
                  <span className={styles.targetLabel}>Entry</span>
                  <span className={styles.targetValue}>${signal.priceTargets.entry.toFixed(2)}</span>
                </div>
                <div className={styles.targetItem}>
                  <span className={styles.targetLabel}>Target</span>
                  <span className={`${styles.targetValue} ${styles.target}`}>
                    ${signal.priceTargets.target.toFixed(2)}
                  </span>
                </div>
                <div className={styles.targetItem}>
                  <span className={styles.targetLabel}>Stop Loss</span>
                  <span className={`${styles.targetValue} ${styles.stopLoss}`}>
                    ${signal.priceTargets.stopLoss.toFixed(2)}
                  </span>
                </div>
              </div>
              
              {/* Potential Gain/Loss */}
              <div className={styles.potentialMove}>
                {signal.signalType === 'BUY' && (
                  <>
                    <div className={styles.moveItem}>
                      <span>Potential Gain:</span>
                      <span className={styles.gain}>
                        +{(((signal.priceTargets.target - signal.priceTargets.entry) / signal.priceTargets.entry) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className={styles.moveItem}>
                      <span>Risk:</span>
                      <span className={styles.loss}>
                        {(((signal.priceTargets.stopLoss - signal.priceTargets.entry) / signal.priceTargets.entry) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </>
                )}
                {signal.signalType === 'SELL' && (
                  <>
                    <div className={styles.moveItem}>
                      <span>Potential Gain:</span>
                      <span className={styles.gain}>
                        +{(((signal.priceTargets.entry - signal.priceTargets.target) / signal.priceTargets.entry) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className={styles.moveItem}>
                      <span>Risk:</span>
                      <span className={styles.loss}>
                        {(((signal.priceTargets.entry - signal.priceTargets.stopLoss) / signal.priceTargets.entry) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Reasoning */}
            <div className={styles.reasoning}>
              <h4>Analysis</h4>
              <p>{signal.reasoning}</p>
            </div>

            {/* Risk Score */}
            {signal.riskScore !== undefined && (
              <div className={styles.riskScore}>
                <span className={styles.riskLabel}>Risk Level:</span>
                <span className={`${styles.riskBadge} ${
                  signal.riskScore <= 33 ? styles.lowRisk : 
                  signal.riskScore <= 66 ? styles.mediumRisk : 
                  styles.highRisk
                }`}>
                  {signal.riskScore <= 33 ? 'Low' : signal.riskScore <= 66 ? 'Medium' : 'High'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TradingSignalSection
