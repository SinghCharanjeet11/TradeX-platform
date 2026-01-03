import { useSentiment } from '../../hooks/useAIInsights'
import { MdSentimentSatisfied, MdSentimentDissatisfied, MdSentimentNeutral, MdTrendingUp, MdTrendingDown, MdTrendingFlat } from 'react-icons/md'
import styles from './SentimentSection.module.css'

function SentimentSection({ symbol }) {
  const { sentiment, loading, error } = useSentiment(symbol, 48)

  if (loading) {
    return (
      <div className={styles.section}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Analyzing sentiment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.error}>
          <MdSentimentNeutral className={styles.errorIcon} />
          <p>Unable to load sentiment</p>
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!sentiment) {
    return (
      <div className={styles.section}>
        <div className={styles.noData}>
          <MdSentimentNeutral className={styles.noDataIcon} />
          <p>No sentiment data available</p>
        </div>
      </div>
    )
  }

  const getSentimentIcon = () => {
    if (sentiment.sentiment === 'bullish') return <MdSentimentSatisfied />
    if (sentiment.sentiment === 'bearish') return <MdSentimentDissatisfied />
    return <MdSentimentNeutral />
  }

  const getTrendIcon = () => {
    if (sentiment.trend === 'improving') return <MdTrendingUp />
    if (sentiment.trend === 'declining') return <MdTrendingDown />
    return <MdTrendingFlat />
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        {getSentimentIcon()}
        <h3>Market Sentiment</h3>
      </div>

      {/* Sentiment Score */}
      <div className={styles.sentimentScore}>
        <div className={`${styles.scoreCircle} ${styles[sentiment.sentiment]}`}>
          <span className={styles.scoreValue}>{(sentiment.sentimentScore * 100).toFixed(0)}</span>
          <span className={styles.scoreLabel}>{sentiment.sentiment}</span>
        </div>
        
        <div className={styles.trendInfo}>
          <div className={`${styles.trend} ${styles[sentiment.trend]}`}>
            {getTrendIcon()}
            <span>{sentiment.trend}</span>
          </div>
          {sentiment.trendChange !== 0 && (
            <span className={styles.trendChange}>
              {sentiment.trendChange > 0 ? '+' : ''}{(sentiment.trendChange * 100).toFixed(1)}% change
            </span>
          )}
        </div>
      </div>

      {/* Articles Analyzed */}
      <div className={styles.articlesInfo}>
        <span>Based on {sentiment.articlesAnalyzed} recent articles</span>
      </div>

      {/* Top Articles */}
      {sentiment.topArticles && sentiment.topArticles.length > 0 && (
        <div className={styles.articles}>
          <h4>Top Contributing Articles</h4>
          <div className={styles.articlesList}>
            {sentiment.topArticles.slice(0, 5).map((article, index) => {
              const articleSentiment = article.sentiment > 0.2 ? 'positive' : article.sentiment < -0.2 ? 'negative' : 'neutral'
              
              return (
                <div key={index} className={styles.article}>
                  <div className={styles.articleHeader}>
                    <span className={`${styles.sentimentBadge} ${styles[articleSentiment]}`}>
                      {articleSentiment}
                    </span>
                    <span className={styles.source}>{article.source}</span>
                  </div>
                  <p className={styles.articleTitle}>{article.title}</p>
                  <span className={styles.publishedAt}>
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <span className={styles.lastUpdated}>
          Analyzed: {new Date(sentiment.analyzedAt).toLocaleString()}
        </span>
      </div>
    </div>
  )
}

export default SentimentSection
