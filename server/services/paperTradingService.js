/**
 * Paper Trading Service
 * Business logic for paper trading operations
 */

import paperAccountRepository from '../repositories/paperAccountRepository.js';
import holdingsRepository from '../repositories/holdingsRepository.js';
import ordersRepository from '../repositories/ordersRepository.js';

class PaperTradingService {
  /**
   * Initialize new paper account with $100k
   */
  async initializeAccount(userId) {
    try {
      // Check if account already exists
      const existing = await paperAccountRepository.getAccountByUserId(userId);
      if (existing) {
        return existing;
      }

      // Create new account
      const account = await paperAccountRepository.createAccount(userId, 100000);
      return account;
    } catch (error) {
      console.error('[PaperTradingService] Error initializing account:', error);
      throw error;
    }
  }

  /**
   * Get current paper account balance and stats
   */
  async getAccountSummary(userId) {
    try {
      // Get or create account
      let account = await paperAccountRepository.getAccountByUserId(userId);
      if (!account) {
        account = await this.initializeAccount(userId);
      }

      // Get paper trading holdings
      const holdings = await holdingsRepository.getUserHoldings(userId);
      const paperHoldings = holdings.filter(h => h.account === 'paper');

      // Calculate portfolio value
      const portfolioValue = paperHoldings.reduce((sum, h) => {
        return sum + (h.quantity * (h.currentPrice || h.avgBuyPrice));
      }, 0);

      // Calculate total value
      const totalValue = account.currentBalance + portfolioValue;

      // Calculate profit/loss percentage
      const profitLossPercent = account.initialBalance > 0
        ? ((totalValue - account.initialBalance) / account.initialBalance) * 100
        : 0;

      // Calculate win rate
      const winRate = account.totalTrades > 0
        ? (account.winningTrades / account.totalTrades) * 100
        : 0;

      return {
        ...account,
        portfolioValue,
        totalValue,
        profitLossPercent,
        winRate,
        holdings: paperHoldings
      };
    } catch (error) {
      console.error('[PaperTradingService] Error getting account summary:', error);
      throw error;
    }
  }

  /**
   * Calculate performance metrics
   */
  async calculatePerformance(userId) {
    try {
      const account = await paperAccountRepository.getAccountByUserId(userId);
      if (!account) {
        throw new Error('Paper trading account not found');
      }

      // Get paper trading orders
      const orders = await ordersRepository.getUserOrders(userId);
      const paperOrders = orders.filter(o => o.account === 'paper');

      // Calculate metrics
      const totalReturn = account.initialBalance > 0
        ? ((account.currentBalance + account.totalInvested - account.initialBalance) / account.initialBalance) * 100
        : 0;

      const winRate = account.totalTrades > 0
        ? (account.winningTrades / account.totalTrades) * 100
        : 0;

      const avgTradeSize = account.totalTrades > 0
        ? paperOrders.reduce((sum, o) => sum + o.totalValue, 0) / account.totalTrades
        : 0;

      // Calculate best and worst trades
      const completedTrades = paperOrders.filter(o => o.status === 'completed');
      const tradesWithPL = completedTrades.map(trade => ({
        ...trade,
        profitLoss: this._calculateTradeProfitLoss(trade, completedTrades)
      }));

      const sortedTrades = tradesWithPL.sort((a, b) => b.profitLoss - a.profitLoss);
      const bestTrade = sortedTrades[0] || null;
      const worstTrade = sortedTrades[sortedTrades.length - 1] || null;

      return {
        totalReturn,
        winRate,
        avgTradeSize,
        bestTrade,
        worstTrade,
        totalTrades: account.totalTrades,
        winningTrades: account.winningTrades,
        losingTrades: account.losingTrades
      };
    } catch (error) {
      console.error('[PaperTradingService] Error calculating performance:', error);
      throw error;
    }
  }

  /**
   * Validate paper trading order
   */
  async validateOrder(userId, orderData) {
    try {
      const account = await paperAccountRepository.getAccountByUserId(userId);
      if (!account) {
        return { valid: false, error: 'Paper trading account not found' };
      }

      const { orderType, quantity, price, symbol, assetType } = orderData;

      // Validate buy order
      if (orderType === 'buy') {
        const totalCost = quantity * price;
        if (totalCost > account.currentBalance) {
          return {
            valid: false,
            error: `Insufficient balance. Required: $${totalCost.toFixed(2)}, Available: $${account.currentBalance.toFixed(2)}`
          };
        }
      }

      // Validate sell order
      if (orderType === 'sell') {
        const holdings = await holdingsRepository.getUserHoldings(userId);
        const holding = holdings.find(h => 
          h.symbol === symbol && 
          h.assetType === assetType && 
          h.account === 'paper'
        );

        if (!holding || holding.quantity < quantity) {
          return {
            valid: false,
            error: `Insufficient holdings. Required: ${quantity}, Available: ${holding?.quantity || 0}`
          };
        }
      }

      return { valid: true };
    } catch (error) {
      console.error('[PaperTradingService] Error validating order:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Execute paper trading order
   */
  async executePaperOrder(userId, orderData) {
    try {
      // Validate order
      const validation = await this.validateOrder(userId, orderData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const { orderType, quantity, price, symbol, name, assetType } = orderData;
      const totalValue = quantity * price;

      // Get account
      const account = await paperAccountRepository.getAccountByUserId(userId);

      // Execute buy order
      if (orderType === 'buy') {
        // Deduct from balance
        const newBalance = account.currentBalance - totalValue;
        await paperAccountRepository.updateBalance(userId, newBalance);

        // Add or update holding
        const holdings = await holdingsRepository.getUserHoldings(userId);
        const existingHolding = holdings.find(h => 
          h.symbol === symbol && 
          h.assetType === assetType && 
          h.account === 'paper'
        );

        if (existingHolding) {
          // Update existing holding
          const newQuantity = existingHolding.quantity + quantity;
          const newAvgPrice = ((existingHolding.quantity * existingHolding.avgBuyPrice) + (quantity * price)) / newQuantity;
          
          await holdingsRepository.updateHolding(existingHolding.id, userId, {
            ...existingHolding,
            quantity: newQuantity,
            avgBuyPrice: newAvgPrice,
            currentPrice: price
          });
        } else {
          // Create new holding
          await holdingsRepository.createHolding(userId, {
            symbol,
            name,
            assetType,
            quantity,
            avgBuyPrice: price,
            currentPrice: price,
            account: 'paper'
          });
        }

        // Update account stats
        await paperAccountRepository.updateStatistics(userId, {
          totalInvested: account.totalInvested + totalValue,
          totalTrades: account.totalTrades + 1
        });
      }

      // Execute sell order
      if (orderType === 'sell') {
        // Add to balance
        const newBalance = account.currentBalance + totalValue;
        await paperAccountRepository.updateBalance(userId, newBalance);

        // Update or remove holding
        const holdings = await holdingsRepository.getUserHoldings(userId);
        const holding = holdings.find(h => 
          h.symbol === symbol && 
          h.assetType === assetType && 
          h.account === 'paper'
        );

        const profitLoss = (price - holding.avgBuyPrice) * quantity;
        const isWinningTrade = profitLoss > 0;

        if (holding.quantity === quantity) {
          // Remove holding completely
          await holdingsRepository.deleteHolding(holding.id, userId);
        } else {
          // Reduce quantity
          await holdingsRepository.updateHolding(holding.id, userId, {
            ...holding,
            quantity: holding.quantity - quantity,
            currentPrice: price
          });
        }

        // Update account stats
        await paperAccountRepository.updateStatistics(userId, {
          totalInvested: Math.max(0, account.totalInvested - (holding.avgBuyPrice * quantity)),
          totalProfitLoss: account.totalProfitLoss + profitLoss,
          totalTrades: account.totalTrades + 1,
          winningTrades: account.winningTrades + (isWinningTrade ? 1 : 0),
          losingTrades: account.losingTrades + (isWinningTrade ? 0 : 1)
        });
      }

      // Create order record
      const order = await ordersRepository.createOrder(userId, {
        symbol,
        name,
        assetType,
        orderType,
        quantity,
        price,
        totalValue,
        status: 'completed',
        account: 'paper'
      });

      return order;
    } catch (error) {
      console.error('[PaperTradingService] Error executing paper order:', error);
      throw error;
    }
  }

  /**
   * Reset paper trading account
   */
  async resetAccount(userId) {
    try {
      // Record reset and reset account
      const account = await paperAccountRepository.recordReset(userId);

      // Delete all paper holdings
      const holdings = await holdingsRepository.getUserHoldings(userId);
      const paperHoldingIds = holdings
        .filter(h => h.account === 'paper')
        .map(h => h.id);

      if (paperHoldingIds.length > 0) {
        await holdingsRepository.bulkDeleteHoldings(paperHoldingIds, userId);
      }

      // Note: We keep order history for learning purposes

      return account;
    } catch (error) {
      console.error('[PaperTradingService] Error resetting account:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 100, currentUserId = null) {
    try {
      const leaderboardData = await paperAccountRepository.getLeaderboardData(limit);

      // Calculate rankings and add portfolio values
      const rankings = await Promise.all(leaderboardData.map(async (entry, index) => {
        const holdings = await holdingsRepository.getUserHoldings(entry.userId);
        const paperHoldings = holdings.filter(h => h.account === 'paper');
        
        const portfolioValue = paperHoldings.reduce((sum, h) => {
          return sum + (h.quantity * (h.currentPrice || h.avgBuyPrice));
        }, 0);

        const totalValue = entry.currentBalance + portfolioValue;
        const profitLoss = totalValue - 100000; // Initial balance
        const profitLossPercent = (profitLoss / 100000) * 100;
        const winRate = entry.totalTrades > 0 ? (entry.winningTrades / entry.totalTrades) * 100 : 0;

        return {
          rank: index + 1,
          username: entry.username,
          userId: entry.userId,
          portfolioValue: totalValue,
          profitLoss,
          profitLossPercent,
          totalTrades: entry.totalTrades,
          winRate,
          isCurrentUser: entry.userId === currentUserId
        };
      }));

      return rankings;
    } catch (error) {
      console.error('[PaperTradingService] Error getting leaderboard:', error);
      throw error;
    }
  }

  /**
   * Update leaderboard visibility
   */
  async updateLeaderboardVisibility(userId, isVisible) {
    try {
      const account = await paperAccountRepository.updateLeaderboardVisibility(userId, isVisible);
      return account;
    } catch (error) {
      console.error('[PaperTradingService] Error updating leaderboard visibility:', error);
      throw error;
    }
  }

  /**
   * Get performance history for charts
   */
  async getPerformanceHistory(userId, period = '30d') {
    try {
      // Parse period (7d, 30d, 90d, all)
      let days;
      switch (period) {
        case '7d':
          days = 7;
          break;
        case '30d':
          days = 30;
          break;
        case '90d':
          days = 90;
          break;
        case 'all':
          days = 365 * 10; // 10 years max
          break;
        default:
          days = 30;
      }

      // Get performance history from repository
      const history = await paperAccountRepository.getPerformanceHistory(userId, days);

      // If no history, return current account value as single data point
      if (history.length === 0) {
        const account = await this.getAccountSummary(userId);
        return [{
          date: new Date().toISOString().split('T')[0],
          value: account.totalValue,
          profitLoss: account.totalProfitLoss,
          profitLossPercent: account.profitLossPercent
        }];
      }

      return history;
    } catch (error) {
      console.error('[PaperTradingService] Error getting performance history:', error);
      throw error;
    }
  }

  // Private helper methods

  _calculateTradeProfitLoss(trade, allTrades) {
    // Simple P/L calculation for demonstration
    // In production, match buy/sell pairs
    if (trade.orderType === 'sell') {
      const buyTrades = allTrades.filter(t => 
        t.symbol === trade.symbol && 
        t.orderType === 'buy' &&
        t.executedAt < trade.executedAt
      );
      
      if (buyTrades.length > 0) {
        const avgBuyPrice = buyTrades.reduce((sum, t) => sum + t.price, 0) / buyTrades.length;
        return (trade.price - avgBuyPrice) * trade.quantity;
      }
    }
    return 0;
  }
}

export default new PaperTradingService();
