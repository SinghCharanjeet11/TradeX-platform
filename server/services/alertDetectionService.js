/**
 * Alert Detection Service
 * Detects market anomalies and generates alerts for users
 */
class AlertDetectionService {
  /**
   * Detect anomalies in price movements
   * @param {string} symbol - Asset symbol
   * @param {Array} priceHistory - Historical price data
   * @param {number} currentPrice - Current price
   * @returns {Object|null} - Anomaly detection result or null
   */
  detectAnomaly(symbol, priceHistory, currentPrice) {
    if (!priceHistory || priceHistory.length < 2) {
      return null;
    }

    // Calculate mean and standard deviation
    const prices = priceHistory.map(p => p.price);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    const variance = prices.reduce((sum, price) => {
      return sum + Math.pow(price - mean, 2);
    }, 0) / prices.length;
    
    const stdDev = Math.sqrt(variance);

    // Check if current price is more than 2 standard deviations from mean
    const deviation = Math.abs(currentPrice - mean) / stdDev;
    
    if (deviation > 2) {
      const direction = currentPrice > mean ? 'spike' : 'drop';
      const percentChange = ((currentPrice - mean) / mean) * 100;
      
      return {
        symbol,
        anomalyType: direction,
        currentPrice,
        mean,
        stdDev,
        deviation,
        percentChange: Math.abs(percentChange),
        severity: this._calculateSeverity(deviation)
      };
    }

    return null;
  }

  /**
   * Generate alert from anomaly detection
   * @param {Object} anomaly - Anomaly detection result
   * @param {number} userId - User ID
   * @param {string} sensitivity - User's alert sensitivity (low, medium, high)
   * @returns {Object|null} - Generated alert or null
   */
  generateAlert(anomaly, userId, sensitivity = 'medium') {
    if (!anomaly) {
      return null;
    }

    // Filter by sensitivity
    if (!this._matchesSensitivity(anomaly.severity, sensitivity)) {
      return null;
    }

    const alert = {
      userId,
      symbol: anomaly.symbol,
      alertType: 'anomaly',
      severity: anomaly.severity,
      title: this._generateTitle(anomaly),
      message: this._generateMessage(anomaly),
      recommendedAction: this._generateRecommendedAction(anomaly),
      data: {
        currentPrice: anomaly.currentPrice,
        mean: anomaly.mean,
        deviation: anomaly.deviation,
        percentChange: anomaly.percentChange
      },
      channels: ['in-app'],
      read: false,
      createdAt: new Date()
    };

    return alert;
  }

  /**
   * Group alerts that occur within a time window
   * @param {Array} alerts - Array of alerts
   * @param {number} windowMinutes - Time window in minutes (default: 5)
   * @returns {Array} - Grouped alerts
   */
  groupAlerts(alerts, windowMinutes = 5) {
    if (!alerts || alerts.length === 0) {
      return [];
    }

    // Sort alerts by creation time
    const sortedAlerts = [...alerts].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );

    const grouped = [];
    const windowMs = windowMinutes * 60 * 1000;

    let currentGroup = [sortedAlerts[0]];
    let groupStartTime = new Date(sortedAlerts[0].createdAt);

    for (let i = 1; i < sortedAlerts.length; i++) {
      const alert = sortedAlerts[i];
      const alertTime = new Date(alert.createdAt);
      const timeDiff = alertTime - groupStartTime;

      if (timeDiff <= windowMs) {
        // Add to current group
        currentGroup.push(alert);
      } else {
        // Create grouped alert and start new group
        if (currentGroup.length > 1) {
          grouped.push(this._createGroupedAlert(currentGroup));
        } else {
          grouped.push(currentGroup[0]);
        }
        
        currentGroup = [alert];
        groupStartTime = alertTime;
      }
    }

    // Handle last group
    if (currentGroup.length > 1) {
      grouped.push(this._createGroupedAlert(currentGroup));
    } else if (currentGroup.length === 1) {
      grouped.push(currentGroup[0]);
    }

    return grouped;
  }

  /**
   * Calculate severity based on deviation
   * @private
   */
  _calculateSeverity(deviation) {
    if (deviation >= 4) {
      return 'high';
    } else if (deviation >= 3) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Check if anomaly matches user's sensitivity setting
   * @private
   */
  _matchesSensitivity(severity, sensitivity) {
    const severityLevels = { low: 1, medium: 2, high: 3 };
    const sensitivityThresholds = {
      low: 3,    // Only high severity
      medium: 2, // Medium and high severity
      high: 1    // All severities
    };

    const severityLevel = severityLevels[severity] || 1;
    const threshold = sensitivityThresholds[sensitivity] || 2;

    return severityLevel >= threshold;
  }

  /**
   * Generate alert title
   * @private
   */
  _generateTitle(anomaly) {
    const direction = anomaly.anomalyType === 'spike' ? 'Surge' : 'Drop';
    return `${anomaly.symbol} Price ${direction} Detected`;
  }

  /**
   * Generate alert message
   * @private
   */
  _generateMessage(anomaly) {
    const direction = anomaly.anomalyType === 'spike' ? 'increased' : 'decreased';
    const percentChange = anomaly.percentChange.toFixed(2);
    
    return `${anomaly.symbol} has ${direction} by ${percentChange}% from its recent average. ` +
           `This represents a ${anomaly.deviation.toFixed(2)} standard deviation move, ` +
           `which is considered unusual market activity.`;
  }

  /**
   * Generate recommended action
   * @private
   */
  _generateRecommendedAction(anomaly) {
    if (anomaly.anomalyType === 'spike') {
      if (anomaly.severity === 'high') {
        return 'Consider taking profits or setting stop-loss orders to protect gains.';
      } else {
        return 'Monitor closely for potential reversal or continuation.';
      }
    } else {
      if (anomaly.severity === 'high') {
        return 'Review your position and consider if this presents a buying opportunity or if you should cut losses.';
      } else {
        return 'Monitor the situation and wait for stabilization before making decisions.';
      }
    }
  }

  /**
   * Create a grouped alert from multiple alerts
   * @private
   */
  _createGroupedAlert(alerts) {
    const symbols = [...new Set(alerts.map(a => a.symbol))];
    const highestSeverity = this._getHighestSeverity(alerts.map(a => a.severity));
    
    return {
      userId: alerts[0].userId,
      symbol: symbols.length === 1 ? symbols[0] : 'Multiple',
      alertType: 'anomaly',
      severity: highestSeverity,
      title: `${alerts.length} Market Alerts`,
      message: `Multiple unusual price movements detected: ${symbols.join(', ')}`,
      recommendedAction: 'Review your portfolio and assess the impact of these market movements.',
      data: {
        groupedAlerts: alerts.map(a => ({
          symbol: a.symbol,
          severity: a.severity,
          percentChange: a.data.percentChange
        })),
        count: alerts.length
      },
      channels: ['in-app'],
      read: false,
      createdAt: alerts[0].createdAt,
      isGrouped: true
    };
  }

  /**
   * Get highest severity from array
   * @private
   */
  _getHighestSeverity(severities) {
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }
}

export default new AlertDetectionService();
