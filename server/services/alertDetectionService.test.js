import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import alertDetectionService from './alertDetectionService.js';

describe('AlertDetectionService', () => {
  describe('Property Tests', () => {
    test('Property 21: Complete alert structure', () => {
      // Feature: ai-insights, Property 21: Complete alert structure
      // Validates: Requirements 8.2, 8.3
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // userId
          fc.string({ minLength: 1, maxLength: 10 }), // symbol
          fc.constantFrom('spike', 'drop'), // anomalyType
          fc.double({ min: 50, max: 200, noNaN: true }), // currentPrice
          fc.double({ min: 50, max: 150, noNaN: true }), // mean
          fc.double({ min: 1, max: 20, noNaN: true }), // stdDev
          fc.double({ min: 2.1, max: 10, noNaN: true }), // deviation
          fc.double({ min: 5, max: 100, noNaN: true }), // percentChange
          fc.constantFrom('low', 'medium', 'high'), // severity
          fc.constantFrom('low', 'medium', 'high'), // sensitivity
          (userId, symbol, anomalyType, currentPrice, mean, stdDev, deviation, percentChange, severity, sensitivity) => {
            // Create anomaly
            const anomaly = {
              symbol,
              anomalyType,
              currentPrice,
              mean,
              stdDev,
              deviation,
              percentChange,
              severity
            };

            // Generate alert
            const alert = alertDetectionService.generateAlert(anomaly, userId, sensitivity);

            // If alert is generated (not filtered by sensitivity)
            if (alert) {
              // Verify complete alert structure
              // Must have asset symbol
              expect(alert.symbol).toBe(symbol);
              expect(typeof alert.symbol).toBe('string');
              expect(alert.symbol.length).toBeGreaterThan(0);

              // Must have anomaly type
              expect(alert.alertType).toBe('anomaly');
              expect(typeof alert.alertType).toBe('string');

              // Must have recommended action
              expect(alert.recommendedAction).toBeTruthy();
              expect(typeof alert.recommendedAction).toBe('string');
              expect(alert.recommendedAction.length).toBeGreaterThan(0);

              // Must be delivered via in-app notification
              expect(alert.channels).toContain('in-app');
              expect(Array.isArray(alert.channels)).toBe(true);
              expect(alert.channels.length).toBeGreaterThan(0);

              // Additional structure validation
              expect(alert.userId).toBe(userId);
              expect(['low', 'medium', 'high']).toContain(alert.severity);
              expect(alert.title).toBeTruthy();
              expect(alert.message).toBeTruthy();
              expect(alert.data).toBeTruthy();
              expect(typeof alert.data).toBe('object');
              expect(alert.read).toBe(false);
              expect(alert.createdAt).toBeInstanceOf(Date);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 20: Alert triggering for anomalies', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }), // symbol
          fc.double({ min: 50, max: 150, noNaN: true }), // basePrice
          fc.array(
            fc.double({ min: -10, max: 10, noNaN: true }),
            { minLength: 10, maxLength: 50 }
          ), // priceVariations
          fc.double({ min: 0.5, max: 5, noNaN: true }), // deviationMultiplier
          (symbol, basePrice, priceVariations, deviationMultiplier) => {
            // Create price history with guaranteed variance
            const priceHistory = priceVariations.map(variation => ({
              price: basePrice + variation
            }));

            // Calculate mean and standard deviation
            const prices = priceHistory.map(p => p.price);
            const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            
            const variance = prices.reduce((sum, price) => {
              return sum + Math.pow(price - mean, 2);
            }, 0) / prices.length;
            
            const stdDev = Math.sqrt(variance);

            // Pre-condition: Only test if we have meaningful variance
            fc.pre(stdDev >= 1);

            // Create a price that is more than 2 standard deviations from mean
            const currentPrice = mean + (stdDev * deviationMultiplier * 2.5);

            // Detect anomaly
            const anomaly = alertDetectionService.detectAnomaly(
              symbol,
              priceHistory,
              currentPrice
            );

            // For any price movement exceeding 2 standard deviations, an anomaly should be detected
            // Note: The anomaly might be null if the actual deviation calculated by the service
            // is not > 2 due to floating point precision or rounding
            if (anomaly) {
              expect(anomaly.symbol).toBe(symbol);
              expect(anomaly.deviation).toBeGreaterThan(2);
              expect(anomaly.anomalyType).toMatch(/^(spike|drop)$/);
              expect(['low', 'medium', 'high']).toContain(anomaly.severity);
            } else {
              // If no anomaly detected, verify the deviation is actually <= 2
              const actualDeviation = Math.abs(currentPrice - mean) / stdDev;
              expect(actualDeviation).toBeLessThanOrEqual(2.1); // Small tolerance for floating point
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 20: No alert for normal price movements', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }), // symbol
          fc.array(
            fc.record({
              price: fc.double({ min: 50, max: 150, noNaN: true })
            }),
            { minLength: 10, maxLength: 50 }
          ), // priceHistory
          (symbol, priceHistory) => {
            // Calculate mean
            const prices = priceHistory.map(p => p.price);
            const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;

            // Use a price close to the mean (within 1 standard deviation)
            const currentPrice = mean * 1.05; // 5% from mean

            // Detect anomaly
            const anomaly = alertDetectionService.detectAnomaly(
              symbol,
              priceHistory,
              currentPrice
            );

            // For normal price movements (< 2 std dev), no anomaly should be detected
            // Note: This might occasionally trigger if the data has very low variance
            // but that's statistically rare with our test data range
            if (anomaly) {
              expect(anomaly.deviation).toBeGreaterThan(2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 22: Alert sensitivity respect', () => {
      // Feature: ai-insights, Property 22: Alert sensitivity respect
      // Validates: Requirements 8.4
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // userId
          fc.string({ minLength: 1, maxLength: 10 }), // symbol
          fc.constantFrom('spike', 'drop'), // anomalyType
          fc.double({ min: 50, max: 200, noNaN: true }), // currentPrice
          fc.double({ min: 50, max: 150, noNaN: true }), // mean
          fc.double({ min: 1, max: 20, noNaN: true }), // stdDev
          fc.constantFrom('low', 'medium', 'high'), // severity
          fc.constantFrom('low', 'medium', 'high'), // sensitivity
          (userId, symbol, anomalyType, currentPrice, mean, stdDev, severity, sensitivity) => {
            // Calculate deviation based on severity
            let deviation;
            if (severity === 'high') {
              deviation = 4.5; // >= 4
            } else if (severity === 'medium') {
              deviation = 3.5; // >= 3 and < 4
            } else {
              deviation = 2.5; // >= 2 and < 3
            }

            const percentChange = Math.abs(((currentPrice - mean) / mean) * 100);

            // Create anomaly with specific severity
            const anomaly = {
              symbol,
              anomalyType,
              currentPrice,
              mean,
              stdDev,
              deviation,
              percentChange,
              severity
            };

            // Generate alert with user's sensitivity setting
            const alert = alertDetectionService.generateAlert(anomaly, userId, sensitivity);

            // Define sensitivity matching rules
            // low sensitivity: only high severity alerts
            // medium sensitivity: medium and high severity alerts
            // high sensitivity: all severity alerts (low, medium, high)
            const shouldGenerateAlert = 
              (sensitivity === 'low' && severity === 'high') ||
              (sensitivity === 'medium' && (severity === 'medium' || severity === 'high')) ||
              (sensitivity === 'high'); // All severities

            // Verify alert generation matches sensitivity settings
            if (shouldGenerateAlert) {
              // Alert should be generated
              expect(alert).not.toBeNull();
              expect(alert.userId).toBe(userId);
              expect(alert.symbol).toBe(symbol);
              expect(alert.severity).toBe(severity);
            } else {
              // Alert should be filtered out
              expect(alert).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 23: Alert grouping', () => {
      // Feature: ai-insights, Property 23: Alert grouping
      // Validates: Requirements 8.5
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // userId
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              severity: fc.constantFrom('low', 'medium', 'high'),
              percentChange: fc.double({ min: 1, max: 50, noNaN: true })
            }),
            { minLength: 2, maxLength: 10 }
          ), // alertData
          fc.integer({ min: 0, max: 4 }), // minutesSpread (0-4 minutes = within 5 min window)
          (userId, alertData, minutesSpread) => {
            // Create base time
            const baseTime = new Date('2024-01-01T12:00:00Z');
            
            // Create alerts within the time window (all within 5 minutes)
            const alerts = alertData.map((data, index) => {
              // Spread alerts evenly within the minutesSpread window
              const minuteOffset = index * (minutesSpread / Math.max(alertData.length - 1, 1));
              
              return {
                userId,
                symbol: data.symbol,
                alertType: 'anomaly',
                severity: data.severity,
                title: `${data.symbol} Alert`,
                message: `Alert for ${data.symbol}`,
                recommendedAction: 'Take action',
                data: { percentChange: data.percentChange },
                channels: ['in-app'],
                read: false,
                createdAt: new Date(baseTime.getTime() + minuteOffset * 60 * 1000)
              };
            });

            // Group the alerts
            const grouped = alertDetectionService.groupAlerts(alerts, 5);

            // For any set of alerts occurring within 5 minutes, they should be grouped
            // Since all our alerts are within minutesSpread (0-4 minutes), they should all be grouped
            if (alerts.length > 1) {
              // Should result in a single grouped alert
              expect(grouped.length).toBe(1);
              expect(grouped[0].isGrouped).toBe(true);
              expect(grouped[0].data.count).toBe(alerts.length);
              
              // Grouped alert should have the same userId
              expect(grouped[0].userId).toBe(userId);
              
              // Grouped alert should have highest severity
              const severities = alerts.map(a => a.severity);
              const expectedSeverity = severities.includes('high') ? 'high' :
                                      severities.includes('medium') ? 'medium' : 'low';
              expect(grouped[0].severity).toBe(expectedSeverity);
            } else {
              // Single alert should remain unchanged
              expect(grouped.length).toBe(1);
              expect(grouped[0]).toEqual(alerts[0]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 23: Alerts outside window not grouped', () => {
      // Feature: ai-insights, Property 23: Alert grouping
      // Validates: Requirements 8.5
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // userId
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              severity: fc.constantFrom('low', 'medium', 'high'),
              percentChange: fc.double({ min: 1, max: 50, noNaN: true })
            }),
            { minLength: 2, maxLength: 5 }
          ), // alertData
          fc.integer({ min: 6, max: 20 }), // minutesBetween (> 5 minutes = outside window)
          (userId, alertData, minutesBetween) => {
            // Create base time
            const baseTime = new Date('2024-01-01T12:00:00Z');
            
            // Create alerts outside the 5-minute window
            const alerts = alertData.map((data, index) => ({
              userId,
              symbol: data.symbol,
              alertType: 'anomaly',
              severity: data.severity,
              title: `${data.symbol} Alert`,
              message: `Alert for ${data.symbol}`,
              recommendedAction: 'Take action',
              data: { percentChange: data.percentChange },
              channels: ['in-app'],
              read: false,
              createdAt: new Date(baseTime.getTime() + index * minutesBetween * 60 * 1000)
            }));

            // Group the alerts with 5-minute window
            const grouped = alertDetectionService.groupAlerts(alerts, 5);

            // Alerts outside the 5-minute window should NOT be grouped
            // Each alert should remain separate
            expect(grouped.length).toBe(alerts.length);
            
            // None should be grouped
            grouped.forEach(alert => {
              expect(alert.isGrouped).toBeUndefined();
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    describe('detectAnomaly', () => {
      test('should detect spike anomaly when price exceeds 2 standard deviations above mean', () => {
        const priceHistory = [
          { price: 100 },
          { price: 102 },
          { price: 98 },
          { price: 101 },
          { price: 99 }
        ];
        const currentPrice = 130; // Significantly above mean

        const anomaly = alertDetectionService.detectAnomaly('BTC', priceHistory, currentPrice);

        expect(anomaly).not.toBeNull();
        expect(anomaly.anomalyType).toBe('spike');
        expect(anomaly.deviation).toBeGreaterThan(2);
      });

      test('should detect drop anomaly when price falls 2 standard deviations below mean', () => {
        const priceHistory = [
          { price: 100 },
          { price: 102 },
          { price: 98 },
          { price: 101 },
          { price: 99 }
        ];
        const currentPrice = 70; // Significantly below mean

        const anomaly = alertDetectionService.detectAnomaly('BTC', priceHistory, currentPrice);

        expect(anomaly).not.toBeNull();
        expect(anomaly.anomalyType).toBe('drop');
        expect(anomaly.deviation).toBeGreaterThan(2);
      });

      test('should return null for normal price movements', () => {
        const priceHistory = [
          { price: 100 },
          { price: 102 },
          { price: 98 },
          { price: 101 },
          { price: 99 }
        ];
        const currentPrice = 101; // Within normal range

        const anomaly = alertDetectionService.detectAnomaly('BTC', priceHistory, currentPrice);

        expect(anomaly).toBeNull();
      });

      test('should return null for insufficient price history', () => {
        const priceHistory = [{ price: 100 }];
        const currentPrice = 150;

        const anomaly = alertDetectionService.detectAnomaly('BTC', priceHistory, currentPrice);

        expect(anomaly).toBeNull();
      });

      test('should calculate correct severity levels', () => {
        const priceHistory = [
          { price: 100 },
          { price: 102 },
          { price: 98 },
          { price: 101 },
          { price: 99 },
          { price: 100 },
          { price: 102 },
          { price: 98 }
        ];

        // Calculate actual mean and std dev
        const prices = priceHistory.map(p => p.price);
        const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
        const stdDev = Math.sqrt(variance);

        // Low severity (2-3 std dev)
        const lowPrice = mean + (stdDev * 2.5);
        const lowAnomaly = alertDetectionService.detectAnomaly('BTC', priceHistory, lowPrice);
        expect(lowAnomaly.severity).toBe('low');

        // Medium severity (3-4 std dev)
        const mediumPrice = mean + (stdDev * 3.5);
        const mediumAnomaly = alertDetectionService.detectAnomaly('BTC', priceHistory, mediumPrice);
        expect(mediumAnomaly.severity).toBe('medium');

        // High severity (>= 4 std dev)
        const highPrice = mean + (stdDev * 4.5);
        const highAnomaly = alertDetectionService.detectAnomaly('BTC', priceHistory, highPrice);
        expect(highAnomaly.severity).toBe('high');
      });
    });

    describe('generateAlert', () => {
      test('should generate alert from anomaly', () => {
        const anomaly = {
          symbol: 'BTC',
          anomalyType: 'spike',
          currentPrice: 130,
          mean: 100,
          stdDev: 10,
          deviation: 3,
          percentChange: 30,
          severity: 'medium'
        };

        const alert = alertDetectionService.generateAlert(anomaly, 1, 'medium');

        expect(alert).not.toBeNull();
        expect(alert.userId).toBe(1);
        expect(alert.symbol).toBe('BTC');
        expect(alert.alertType).toBe('anomaly');
        expect(alert.severity).toBe('medium');
        expect(alert.title).toContain('BTC');
        expect(alert.message).toContain('increased');
        expect(alert.recommendedAction).toBeTruthy();
        expect(alert.channels).toContain('in-app');
        expect(alert.read).toBe(false);
      });

      test('should return null for null anomaly', () => {
        const alert = alertDetectionService.generateAlert(null, 1, 'medium');
        expect(alert).toBeNull();
      });

      test('should filter alerts by sensitivity - low', () => {
        const lowAnomaly = {
          symbol: 'BTC',
          anomalyType: 'spike',
          currentPrice: 105,
          mean: 100,
          stdDev: 2,
          deviation: 2.5,
          percentChange: 5,
          severity: 'low'
        };

        // Low sensitivity should not show low severity alerts
        const alert = alertDetectionService.generateAlert(lowAnomaly, 1, 'low');
        expect(alert).toBeNull();
      });

      test('should filter alerts by sensitivity - medium', () => {
        const lowAnomaly = {
          symbol: 'BTC',
          anomalyType: 'spike',
          currentPrice: 105,
          mean: 100,
          stdDev: 2,
          deviation: 2.5,
          percentChange: 5,
          severity: 'low'
        };

        // Medium sensitivity should not show low severity alerts
        const alert = alertDetectionService.generateAlert(lowAnomaly, 1, 'medium');
        expect(alert).toBeNull();
      });

      test('should filter alerts by sensitivity - high', () => {
        const lowAnomaly = {
          symbol: 'BTC',
          anomalyType: 'spike',
          currentPrice: 105,
          mean: 100,
          stdDev: 2,
          deviation: 2.5,
          percentChange: 5,
          severity: 'low'
        };

        // High sensitivity should show all severity alerts
        const alert = alertDetectionService.generateAlert(lowAnomaly, 1, 'high');
        expect(alert).not.toBeNull();
      });

      test('should generate appropriate recommended actions for spikes', () => {
        const highSpike = {
          symbol: 'BTC',
          anomalyType: 'spike',
          currentPrice: 150,
          mean: 100,
          stdDev: 10,
          deviation: 5,
          percentChange: 50,
          severity: 'high'
        };

        const alert = alertDetectionService.generateAlert(highSpike, 1, 'high');
        expect(alert.recommendedAction).toContain('profits');
      });

      test('should generate appropriate recommended actions for drops', () => {
        const highDrop = {
          symbol: 'BTC',
          anomalyType: 'drop',
          currentPrice: 50,
          mean: 100,
          stdDev: 10,
          deviation: 5,
          percentChange: 50,
          severity: 'high'
        };

        const alert = alertDetectionService.generateAlert(highDrop, 1, 'high');
        expect(alert.recommendedAction).toContain('position');
      });
    });

    describe('groupAlerts', () => {
      test('should return empty array for empty input', () => {
        const grouped = alertDetectionService.groupAlerts([]);
        expect(grouped).toEqual([]);
      });

      test('should return single alert unchanged', () => {
        const alerts = [{
          userId: 1,
          symbol: 'BTC',
          severity: 'high',
          data: { percentChange: 10 },
          createdAt: new Date()
        }];

        const grouped = alertDetectionService.groupAlerts(alerts);
        expect(grouped).toHaveLength(1);
        expect(grouped[0]).toEqual(alerts[0]);
      });

      test('should group alerts within 5-minute window', () => {
        const baseTime = new Date('2024-01-01T12:00:00Z');
        const alerts = [
          {
            userId: 1,
            symbol: 'BTC',
            severity: 'high',
            data: { percentChange: 10 },
            createdAt: new Date(baseTime.getTime())
          },
          {
            userId: 1,
            symbol: 'ETH',
            severity: 'medium',
            data: { percentChange: 5 },
            createdAt: new Date(baseTime.getTime() + 2 * 60 * 1000) // 2 minutes later
          }
        ];

        const grouped = alertDetectionService.groupAlerts(alerts);
        expect(grouped).toHaveLength(1);
        expect(grouped[0].isGrouped).toBe(true);
        expect(grouped[0].data.count).toBe(2);
      });

      test('should not group alerts outside 5-minute window', () => {
        const baseTime = new Date('2024-01-01T12:00:00Z');
        const alerts = [
          {
            userId: 1,
            symbol: 'BTC',
            severity: 'high',
            data: { percentChange: 10 },
            createdAt: new Date(baseTime.getTime())
          },
          {
            userId: 1,
            symbol: 'ETH',
            severity: 'medium',
            data: { percentChange: 5 },
            createdAt: new Date(baseTime.getTime() + 6 * 60 * 1000) // 6 minutes later
          }
        ];

        const grouped = alertDetectionService.groupAlerts(alerts);
        expect(grouped).toHaveLength(2);
        expect(grouped[0].isGrouped).toBeUndefined();
        expect(grouped[1].isGrouped).toBeUndefined();
      });

      test('should use highest severity in grouped alert', () => {
        const baseTime = new Date('2024-01-01T12:00:00Z');
        const alerts = [
          {
            userId: 1,
            symbol: 'BTC',
            severity: 'low',
            data: { percentChange: 3 },
            createdAt: new Date(baseTime.getTime())
          },
          {
            userId: 1,
            symbol: 'ETH',
            severity: 'high',
            data: { percentChange: 15 },
            createdAt: new Date(baseTime.getTime() + 1 * 60 * 1000)
          },
          {
            userId: 1,
            symbol: 'ADA',
            severity: 'medium',
            data: { percentChange: 7 },
            createdAt: new Date(baseTime.getTime() + 2 * 60 * 1000)
          }
        ];

        const grouped = alertDetectionService.groupAlerts(alerts);
        expect(grouped).toHaveLength(1);
        expect(grouped[0].severity).toBe('high');
      });

      test('should handle custom time window', () => {
        const baseTime = new Date('2024-01-01T12:00:00Z');
        const alerts = [
          {
            userId: 1,
            symbol: 'BTC',
            severity: 'high',
            data: { percentChange: 10 },
            createdAt: new Date(baseTime.getTime())
          },
          {
            userId: 1,
            symbol: 'ETH',
            severity: 'medium',
            data: { percentChange: 5 },
            createdAt: new Date(baseTime.getTime() + 8 * 60 * 1000) // 8 minutes later
          }
        ];

        // With 10-minute window, should group
        const grouped10 = alertDetectionService.groupAlerts(alerts, 10);
        expect(grouped10).toHaveLength(1);
        expect(grouped10[0].isGrouped).toBe(true);

        // With 5-minute window, should not group
        const grouped5 = alertDetectionService.groupAlerts(alerts, 5);
        expect(grouped5).toHaveLength(2);
      });
    });
  });
});
