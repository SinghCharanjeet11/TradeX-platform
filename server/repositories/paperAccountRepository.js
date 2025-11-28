/**
 * Paper Account Repository
 * Data access layer for paper trading accounts
 */

import { query } from '../config/database.js';

class PaperAccountRepository {
  /**
   * Create new paper trading account
   */
  async createAccount(userId, initialBalance = 100000) {
    const result = await query(
      `INSERT INTO paper_accounts (
        user_id, initial_balance, current_balance
      ) VALUES ($1, $2, $2)
      RETURNING 
        id, user_id as "userId", initial_balance as "initialBalance",
        current_balance as "currentBalance", total_invested as "totalInvested",
        total_profit_loss as "totalProfitLoss", total_trades as "totalTrades",
        winning_trades as "winningTrades", losing_trades as "losingTrades",
        reset_count as "resetCount", last_reset_at as "lastResetAt",
        leaderboard_visible as "leaderboardVisible",
        created_at as "createdAt", updated_at as "updatedAt"`,
      [userId, initialBalance]
    );
    return result.rows[0];
  }

  /**
   * Get paper account by user ID
   */
  async getAccountByUserId(userId) {
    const result = await query(
      `SELECT 
        id, user_id as "userId", initial_balance as "initialBalance",
        current_balance as "currentBalance", total_invested as "totalInvested",
        total_profit_loss as "totalProfitLoss", total_trades as "totalTrades",
        winning_trades as "winningTrades", losing_trades as "losingTrades",
        reset_count as "resetCount", last_reset_at as "lastResetAt",
        leaderboard_visible as "leaderboardVisible",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM paper_accounts 
      WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Update account balance
   */
  async updateBalance(userId, newBalance) {
    const result = await query(
      `UPDATE paper_accounts 
      SET current_balance = $2, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING 
        id, user_id as "userId", initial_balance as "initialBalance",
        current_balance as "currentBalance", total_invested as "totalInvested",
        total_profit_loss as "totalProfitLoss", total_trades as "totalTrades",
        winning_trades as "winningTrades", losing_trades as "losingTrades",
        reset_count as "resetCount", last_reset_at as "lastResetAt",
        leaderboard_visible as "leaderboardVisible",
        created_at as "createdAt", updated_at as "updatedAt"`,
      [userId, newBalance]
    );
    return result.rows[0];
  }

  /**
   * Update account statistics
   */
  async updateStatistics(userId, stats) {
    const result = await query(
      `UPDATE paper_accounts 
      SET 
        current_balance = COALESCE($2, current_balance),
        total_invested = COALESCE($3, total_invested),
        total_profit_loss = COALESCE($4, total_profit_loss),
        total_trades = COALESCE($5, total_trades),
        winning_trades = COALESCE($6, winning_trades),
        losing_trades = COALESCE($7, losing_trades),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING 
        id, user_id as "userId", initial_balance as "initialBalance",
        current_balance as "currentBalance", total_invested as "totalInvested",
        total_profit_loss as "totalProfitLoss", total_trades as "totalTrades",
        winning_trades as "winningTrades", losing_trades as "losingTrades",
        reset_count as "resetCount", last_reset_at as "lastResetAt",
        leaderboard_visible as "leaderboardVisible",
        created_at as "createdAt", updated_at as "updatedAt"`,
      [
        userId,
        stats.currentBalance,
        stats.totalInvested,
        stats.totalProfitLoss,
        stats.totalTrades,
        stats.winningTrades,
        stats.losingTrades
      ]
    );
    return result.rows[0];
  }

  /**
   * Record account reset
   */
  async recordReset(userId) {
    const client = await query('BEGIN');
    
    try {
      // Get current account state
      const accountResult = await query(
        `SELECT current_balance, total_trades, total_profit_loss 
        FROM paper_accounts WHERE user_id = $1`,
        [userId]
      );
      
      const account = accountResult.rows[0];
      
      // Record reset in history
      await query(
        `INSERT INTO paper_account_resets (
          user_id, balance_before_reset, total_trades_before_reset, 
          profit_loss_before_reset
        ) VALUES ($1, $2, $3, $4)`,
        [userId, account.current_balance, account.total_trades, account.total_profit_loss]
      );
      
      // Reset account
      const resetResult = await query(
        `UPDATE paper_accounts 
        SET 
          current_balance = initial_balance,
          total_invested = 0,
          total_profit_loss = 0,
          total_trades = 0,
          winning_trades = 0,
          losing_trades = 0,
          reset_count = reset_count + 1,
          last_reset_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING 
          id, user_id as "userId", initial_balance as "initialBalance",
          current_balance as "currentBalance", total_invested as "totalInvested",
          total_profit_loss as "totalProfitLoss", total_trades as "totalTrades",
          winning_trades as "winningTrades", losing_trades as "losingTrades",
          reset_count as "resetCount", last_reset_at as "lastResetAt",
          leaderboard_visible as "leaderboardVisible",
          created_at as "createdAt", updated_at as "updatedAt"`,
        [userId]
      );
      
      await query('COMMIT');
      return resetResult.rows[0];
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Get reset history for user
   */
  async getResetHistory(userId, limit = 10) {
    const result = await query(
      `SELECT 
        id, user_id as "userId",
        balance_before_reset as "balanceBeforeReset",
        total_trades_before_reset as "totalTradesBeforeReset",
        profit_loss_before_reset as "profitLossBeforeReset",
        reset_at as "resetAt"
      FROM paper_account_resets 
      WHERE user_id = $1 
      ORDER BY reset_at DESC 
      LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboardData(limit = 100) {
    const result = await query(
      `SELECT 
        pa.user_id as "userId",
        u.username,
        pa.current_balance as "currentBalance",
        pa.total_invested as "totalInvested",
        pa.total_profit_loss as "totalProfitLoss",
        pa.total_trades as "totalTrades",
        pa.winning_trades as "winningTrades",
        pa.losing_trades as "losingTrades",
        pa.created_at as "createdAt"
      FROM paper_accounts pa
      JOIN users u ON pa.user_id = u.id
      WHERE pa.leaderboard_visible = true
      ORDER BY (pa.current_balance + pa.total_invested) DESC
      LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Update leaderboard visibility
   */
  async updateLeaderboardVisibility(userId, isVisible) {
    const result = await query(
      `UPDATE paper_accounts 
      SET leaderboard_visible = $2, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING 
        id, user_id as "userId", initial_balance as "initialBalance",
        current_balance as "currentBalance", total_invested as "totalInvested",
        total_profit_loss as "totalProfitLoss", total_trades as "totalTrades",
        winning_trades as "winningTrades", losing_trades as "losingTrades",
        reset_count as "resetCount", last_reset_at as "lastResetAt",
        leaderboard_visible as "leaderboardVisible",
        created_at as "createdAt", updated_at as "updatedAt"`,
      [userId, isVisible]
    );
    return result.rows[0];
  }

  /**
   * Get portfolio performance history for paper trading
   */
  async getPerformanceHistory(userId, days = 30) {
    const result = await query(
      `SELECT 
        snapshot_date as "date",
        total_value as "value",
        profit_loss as "profitLoss",
        profit_loss_percent as "profitLossPercent"
      FROM portfolio_snapshots 
      WHERE user_id = $1 
        AND snapshot_date >= CURRENT_DATE - $2
      ORDER BY snapshot_date ASC`,
      [userId, days]
    );
    return result.rows;
  }
}

export default new PaperAccountRepository();
