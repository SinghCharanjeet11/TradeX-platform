import { useState } from 'react';
import { MdLightbulb, MdTrendingUp, MdClose, MdRefresh, MdRemoveRedEye } from 'react-icons/md';
import useDashboardData from '../../hooks/useDashboardData';
import insightsService from '../../services/insightsService';
import AssetDetailModal from './AssetDetailModal';
import styles from './RecommendationsCard.module.css';

function RecommendationsCard() {
  const { recommendations, refreshRecommendations, invalidateCache } = useDashboardData();
  const [dismissing, setDismissing] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);


  const handleViewDetails = async (recommendation) => {
    try {
      // Track the view action
      await insightsService.trackRecommendationAction(recommendation.id, 'view');
      
      // Open asset detail modal directly
      setSelectedAsset({
        id: recommendation.metadata?.id || recommendation.symbol.toLowerCase(),
        symbol: recommendation.symbol,
        name: recommendation.metadata?.name || recommendation.name || recommendation.symbol,
        price: recommendation.metadata?.currentPrice || 0,
        change24h: recommendation.metadata?.change24h || 0,
        marketCap: recommendation.metadata?.marketCap || 0,
        volume24h: recommendation.metadata?.volume24h || 0,
        image: recommendation.metadata?.image || null
      });
    } catch (err) {
      console.error('Error tracking recommendation:', err);
      // Still open modal even if tracking fails
      setSelectedAsset({
        id: recommendation.metadata?.id || recommendation.symbol.toLowerCase(),
        symbol: recommendation.symbol,
        name: recommendation.metadata?.name || recommendation.name || recommendation.symbol,
        price: recommendation.metadata?.currentPrice || 0,
        change24h: recommendation.metadata?.change24h || 0,
        marketCap: recommendation.metadata?.marketCap || 0,
        volume24h: recommendation.metadata?.volume24h || 0,
        image: recommendation.metadata?.image || null
      });
    }
  };

  const handleDismiss = async (e, recommendation) => {
    e.stopPropagation();
    
    if (dismissing) return;

    try {
      setDismissing(recommendation.id);
      
      // Track the dismiss action
      await insightsService.trackRecommendationAction(recommendation.id, 'dismiss');
      
      // Invalidate cache and refresh
      invalidateCache('recommendations');
      invalidateCache('dashboard-all');
      await refreshRecommendations();
    } catch (err) {
      console.error('Error dismissing recommendation:', err);
    } finally {
      setDismissing(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    invalidateCache('recommendations');
    invalidateCache('dashboard-all');
    await refreshRecommendations();
    setRefreshing(false);
  };

  if (recommendations.loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <MdLightbulb className={styles.headerIcon} />
            <h3>AI Recommendations</h3>
          </div>
        </div>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Analyzing market opportunities...</p>
        </div>
      </div>
    );
  }

  if (recommendations.error) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <MdLightbulb className={styles.headerIcon} />
            <h3>AI Recommendations</h3>
          </div>
          <button 
            className={styles.refreshBtn} 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <MdRefresh className={refreshing ? styles.spinning : ''} />
          </button>
        </div>
        <div className={styles.error}>
          <p>{recommendations.error}</p>
          <button className={styles.retryBtn} onClick={handleRefresh}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Safely access recommendations data
  const recommendationsData = recommendations.data || [];

  if (recommendationsData.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <MdLightbulb className={styles.headerIcon} />
            <h3>AI Recommendations</h3>
          </div>
          <button 
            className={styles.refreshBtn} 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <MdRefresh className={refreshing ? styles.spinning : ''} />
          </button>
        </div>
        <div className={styles.empty}>
          <MdLightbulb className={styles.emptyIcon} />
          <p>No recommendations available</p>
          <span className={styles.emptyHint}>
            Check back later for personalized trading insights
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <MdLightbulb className={styles.headerIcon} />
          <h3>AI Recommendations</h3>
          <span className={styles.count}>{recommendationsData.length}</span>
        </div>
        <button 
          className={styles.refreshBtn} 
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh recommendations"
        >
          <MdRefresh className={refreshing ? styles.spinning : ''} />
        </button>
      </div>

      <div className={styles.list}>
        {recommendationsData.map((rec) => (
          <div 
            key={rec.id} 
            className={styles.item}
            onClick={() => handleViewDetails(rec)}
          >
            <div className={styles.itemHeader}>
              <div className={styles.assetInfo}>
                <span className={styles.assetName}>{rec.name || rec.symbol}</span>
                <span className={styles.assetSymbol}>{rec.symbol}</span>
              </div>
              <button
                className={styles.dismissBtn}
                onClick={(e) => handleDismiss(e, rec)}
                disabled={dismissing === rec.id}
                title="Dismiss recommendation"
              >
                <MdClose />
              </button>
            </div>

            <div className={styles.itemBody}>
              <div className={styles.reason}>
                <span className={styles.reasonLabel}>Why:</span>
                <span className={styles.reasonText}>{rec.description || rec.title}</span>
              </div>

              {rec.metadata?.change24h && (
                <div className={styles.metric}>
                  <MdTrendingUp className={styles.metricIcon} />
                  <span className={styles.metricLabel}>24h Change:</span>
                  <span className={`${styles.metricValue} ${rec.metadata.change24h > 0 ? styles.positive : styles.negative}`}>
                    {rec.metadata.change24h > 0 ? '+' : ''}{rec.metadata.change24h.toFixed(2)}%
                  </span>
                </div>
              )}

              {rec.confidence && (
                <div className={styles.confidence}>
                  <div className={styles.confidenceBar}>
                    <div 
                      className={styles.confidenceFill}
                      style={{ width: `${rec.confidence}%` }}
                    ></div>
                  </div>
                  <span className={styles.confidenceText}>
                    {rec.confidence}% confidence
                  </span>
                </div>
              )}
            </div>

            <div className={styles.itemFooter}>
              <button className={styles.viewBtn}>
                <MdRemoveRedEye />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <AssetDetailModal 
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          marketType="crypto"
        />
      )}
    </div>
  );
}

export default RecommendationsCard;
