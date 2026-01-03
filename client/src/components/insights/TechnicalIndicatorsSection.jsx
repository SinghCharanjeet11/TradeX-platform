import { useTechnicalIndicators } from '../../hooks/useAIInsights'
import { MdShowChart, MdWarning, MdInfo } from 'react-icons/md'
import styles from './TechnicalIndicatorsSection.module.css'

function TechnicalIndicatorsSection({ symbol, assetType }) {
  const { indicators, loading, error } = useTechnicalIndicators(symbol, assetType)

  if (loading) {
    return (
      <div className={styles.section}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Calculating indicators...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.error}>
          <MdShowChart className={styles.errorIcon} />
          <p>Unable to load indicators</p>
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!indicators || !indicators.indicators || indicators.indicators.length === 0) {
    return (
      <div className={styles.section}>
        <div className={styles.noData}>
          <MdShowChart className={styles.noDataIcon} />
          <p>No indicators available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <MdShowChart className={styles.headerIcon} />
        <h3>Technical Indicators</h3>
      </div>

      {/* Conflict Warning */}
      {indicators.hasConflict && indicators.conflictExplanation && (
        <div className={styles.conflictWarning}>
          <MdWarning className={styles.warningIcon} />
          <div>
            <h4>Conflicting Signals</h4>
            <p>{indicators.conflictExplanation}</p>
          </div>
        </div>
      )}

      {/* Overall Assessment */}
      {indicators.overallAssessment && (
        <div className={styles.assessment}>
          <MdInfo className={styles.assessmentIcon} />
          <p>{indicators.overallAssessment}</p>
        </div>
      )}

      {/* Indicators Grid */}
      <div className={styles.indicatorsGrid}>
        {indicators.indicators.map((indicator, index) => {
          const isExtreme = indicator.isExtreme || false
          
          return (
            <div 
              key={index} 
              className={`${styles.indicatorCard} ${isExtreme ? styles.extreme : ''}`}
            >
              <div className={styles.cardHeader}>
                <h4>{indicator.name}</h4>
                {isExtreme && (
                  <span className={styles.extremeBadge}>Extreme</span>
                )}
              </div>
              
              <div className={styles.indicatorValue}>
                {typeof indicator.value === 'number' 
                  ? indicator.value.toFixed(2) 
                  : indicator.value}
              </div>
              
              <div className={styles.interpretation}>
                <p>{indicator.interpretation}</p>
              </div>

              {/* Educational Tooltip */}
              {indicator.tooltip && (
                <div className={styles.tooltip}>
                  <MdInfo className={styles.tooltipIcon} />
                  <span>{indicator.tooltip}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span className={styles.lastUpdated}>
          Updated: {new Date(indicators.analyzedAt || Date.now()).toLocaleString()}
        </span>
      </div>
    </div>
  )
}

export default TechnicalIndicatorsSection
