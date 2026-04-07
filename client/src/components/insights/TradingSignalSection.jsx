import { useSignals } from '../../hooks/useAIInsights'
import { MdTrendingUp, MdTrendingDown, MdRemoveCircleOutline, MdClose, MdCheckCircle, MdInfoOutline, MdWarningAmber, MdLightbulbOutline, MdAutoAwesome } from 'react-icons/md'
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

  const getMarketConditionClass = (condition) => {
    if (condition === 'BULLISH') return styles.bullish
    if (condition === 'BEARISH') return styles.bearish
    return styles.neutral
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
                {signal.aiPowered && (
                  <span className={styles.aiPoweredBadge}>
                    <MdAutoAwesome className={styles.aiPoweredIcon} />
                    AI Powered
                  </span>
                )}
                <span className={styles.timestamp}>
                  {new Date(signal.generatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.headerRight}>
                {signal.marketCondition && (
                  <span className={`${styles.marketConditionBadge} ${getMarketConditionClass(signal.marketCondition)}`}>
                    {signal.marketCondition}
                  </span>
                )}
                <button
                  className={styles.dismissBtn}
                  onClick={() => handleDismiss(signal.id)}
                  title="Dismiss signal"
                >
                  <MdClose />
                </button>
              </div>
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

            {/* Analysis / Reasoning */}
            <div className={styles.reasoning}>
              <h4>Analysis</h4>
              <p>{signal.reasoning}</p>
            </div>

            {/* Explainability Section */}
            {signal.explainability && (
              <div className={styles.explainability}>
                <div className={styles.explainBlock}>
                  <div className={styles.explainHeader}>
                    <MdInfoOutline className={styles.explainIcon} />
                    <span>Why this decision</span>
                  </div>
                  <ul className={styles.explainList}>
                    {signal.explainability.why.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.explainRow}>
                  <div className={`${styles.explainBlock} ${styles.explainHalf}`}>
                    <div className={styles.explainHeader}>
                      <span className={styles.notBuyDot}></span>
                      <span>Why not BUY</span>
                    </div>
                    <ul className={styles.explainList}>
                      {signal.explainability.why_not_buy.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>

                  <div className={`${styles.explainBlock} ${styles.explainHalf}`}>
                    <div className={styles.explainHeader}>
                      <span className={styles.notSellDot}></span>
                      <span>Why not SELL</span>
                    </div>
                    <ul className={styles.explainList}>
                      {signal.explainability.why_not_sell.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Risk Level + Explanation */}
            <div className={styles.riskRow}>
              <div className={styles.riskScore}>
                <span className={styles.riskLabel}>Risk Level:</span>
                <span className={`${styles.riskBadge} ${
                  signal.riskLevel === 'LOW' ? styles.lowRisk :
                  signal.riskLevel === 'HIGH' ? styles.highRisk :
                  styles.mediumRisk
                }`}>
                  {signal.riskLevel || (signal.riskScore <= 33 ? 'Low' : signal.riskScore <= 66 ? 'Medium' : 'High')}
                </span>
              </div>
              {signal.riskExplanation && (
                <div className={styles.riskExplanation}>
                  <MdWarningAmber className={styles.riskExplainIcon} />
                  <p>{signal.riskExplanation.risk_explanation}</p>
                </div>
              )}
            </div>

            {/* Beginner Explanation */}
            {signal.beginnerExplanation && (
              <div className={styles.beginnerBox}>
                <div className={styles.beginnerHeader}>
                  <MdLightbulbOutline className={styles.beginnerIcon} />
                  <span>Simple Explanation</span>
                </div>
                <p>{signal.beginnerExplanation.beginner_explanation}</p>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  )
}

export default TradingSignalSection
