import { useState, useEffect } from 'react';
import styles from './BreakingNewsSection.module.css';
import newsService from '../../services/newsService';

const URGENT_KEYWORDS = ['crash', 'surge', 'breaking', 'alert', 'urgent', 'emergency', 'critical'];
const REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes
const BREAKING_NEWS_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours

export default function BreakingNewsSection({ onArticleClick }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBreakingNews();
    const interval = setInterval(fetchBreakingNews, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const fetchBreakingNews = async () => {
    try {
      setLoading(true);
      const response = await newsService.getBreakingNews();
      
      // Get articles from response
      const articlesData = response.data || response.articles || [];
      
      // Filter to only articles less than 2 hours old
      const now = Date.now();
      const recentArticles = articlesData.filter(article => {
        const articleTime = new Date(article.publishedAt).getTime();
        return (now - articleTime) < BREAKING_NEWS_THRESHOLD;
      });

      // Sort by date (newest first)
      recentArticles.sort((a, b) => 
        new Date(b.publishedAt) - new Date(a.publishedAt)
      );

      setArticles(recentArticles);
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const hasUrgentKeyword = (article) => {
    const text = `${article.title} ${article.body}`.toLowerCase();
    return URGENT_KEYWORDS.some(keyword => text.includes(keyword));
  };

  const formatTimeAgo = (dateString) => {
    const now = Date.now();
    const articleTime = new Date(dateString).getTime();
    const diffMinutes = Math.floor((now - articleTime) / (60 * 1000));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  };

  const handleArticleClick = (article) => {
    // If article has a URL, open it directly in a new tab
    if (article.url || article.sourceUrl) {
      window.open(article.url || article.sourceUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback to modal if no URL available
      onArticleClick(article);
    }
  };

  if (articles.length === 0) {
    return null;
  }

  return (
    <div className={styles.breakingSection}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon}>🚨</span>
          Breaking News
        </div>
      </div>

      {articles.length > 0 ? (
        <div className={styles.articlesList}>
          {articles.slice(0, 3).map(article => (
            <div
              key={article.id}
              className={styles.articleCard}
              onClick={() => handleArticleClick(article)}
            >
              <div className={styles.articleHeader}>
                <h3 className={styles.articleTitle}>{article.title}</h3>
                {hasUrgentKeyword(article) && (
                  <span className={styles.urgentBadge}>Urgent</span>
                )}
              </div>
              <div className={styles.articleMeta}>
                <span className={styles.source}>{article.source}</span>
                <span className={styles.timestamp}>
                  🕐 {formatTimeAgo(article.publishedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📰</div>
          <div className={styles.emptyText}>No breaking news at the moment</div>
        </div>
      )}
    </div>
  );
}
