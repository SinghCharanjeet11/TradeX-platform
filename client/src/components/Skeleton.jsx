import styles from './Skeleton.module.css'

export function SkeletonText({ width = '100%', height = '16px', style = {} }) {
  return (
    <div
      className={styles.skeleton}
      style={{ width, height, ...style }}
    />
  )
}

export function SkeletonCircle({ size = '40px' }) {
  return (
    <div
      className={`${styles.skeleton} ${styles.skeletonCircle}`}
      style={{ width: size, height: size }}
    />
  )
}

export function PredictionSkeleton() {
  return (
    <div className={styles.predictionSkeleton}>
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.predictionCardSkeleton}>
          <SkeletonText width="40%" height="14px" />
          <SkeletonText width="80%" height="28px" />
          <SkeletonText width="100%" height="12px" />
          <SkeletonText width="100%" height="6px" style={{ marginTop: '8px' }} />
        </div>
      ))}
    </div>
  )
}

export function SentimentSkeleton() {
  return (
    <div className={styles.sentimentSkeleton}>
      <div className={styles.sentimentCircleSkeleton}>
        <SkeletonCircle size="120px" />
      </div>
      <div className={styles.sentimentInfoSkeleton}>
        <SkeletonText width="60%" height="20px" />
        <SkeletonText width="40%" height="16px" />
        <SkeletonText width="80%" height="14px" />
      </div>
    </div>
  )
}

export function SignalSkeleton() {
  return (
    <div className={styles.signalSkeleton}>
      <div className={styles.skeletonRow}>
        <SkeletonText width="30%" height="20px" />
        <SkeletonText width="20%" height="20px" />
      </div>
      <SkeletonText width="100%" height="8px" />
      <div className={styles.skeletonRow}>
        <div className={styles.skeletonCol}>
          <SkeletonText width="100%" height="16px" />
        </div>
        <div className={styles.skeletonCol}>
          <SkeletonText width="100%" height="16px" />
        </div>
        <div className={styles.skeletonCol}>
          <SkeletonText width="100%" height="16px" />
        </div>
      </div>
      <SkeletonText width="100%" height="60px" />
    </div>
  )
}

export function IndicatorsSkeleton() {
  return (
    <div className={styles.indicatorsSkeleton}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={styles.indicatorCardSkeleton}>
          <SkeletonText width="40%" height="18px" />
          <SkeletonText width="60%" height="32px" />
          <SkeletonText width="100%" height="14px" />
          <SkeletonText width="90%" height="14px" />
        </div>
      ))}
    </div>
  )
}

export function RecommendationSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.skeletonRow}>
            <SkeletonText width="30%" height="16px" />
            <SkeletonText width="20%" height="16px" />
          </div>
          <SkeletonText width="100%" height="14px" />
          <SkeletonText width="80%" height="14px" />
          <SkeletonText width="100%" height="6px" style={{ marginTop: '8px' }} />
        </div>
      ))}
    </div>
  )
}

export default {
  Text: SkeletonText,
  Circle: SkeletonCircle,
  Prediction: PredictionSkeleton,
  Sentiment: SentimentSkeleton,
  Signal: SignalSkeleton,
  Indicators: IndicatorsSkeleton,
  Recommendation: RecommendationSkeleton
}
