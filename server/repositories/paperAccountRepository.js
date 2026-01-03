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
    
    // CRITICAL: Convert all numeric values to JavaScript numbers
    // PostgreSQL numeric type can be returned as strings by the pg driver
    if (result.rows[0]) {
      const account = result.rows[0];
      return {
        ...account,
        initialBalance: Number(account.initialBalance) || 100000,
        currentBalance: Number(account.currentBalance) || 0,
        totalInvested: Number(account.totalInvested) || 0,
        totalProfitLoss: Number(account.totalProfitLoss) || 0,
        totalTrades: parseInt(account.totalTrades) || 0,
        winningTrades: parseInt(account.winningTrades) || 0,
        losingTrades: parseInt(account.losingTrades) || 0,
        resetCount: parseInt(account.resetCount) || 0
      };
    }
    return result.rows[0];
  }

  /**
   * Update account balance
   */
  async updateBalance(userId, newBalance) {
    // CRITICAL: Validate and convert to number to prevent string concatenation issues
    const balanceValue = Number(newBalance);
    if (isNaN(balanceValue) || !isFinite(balanceValue)) {
      throw new Error(`Invalid balance value: ${newBalance}. Must be a valid number.`);
    }
    
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
      [userId, balanceValue]
    );
    return result.rows[0];
  }

  /**
   * Update account statistics
   */
  async updateStatistics(userId, stats) {
    // CRITICAL: Convert all numeric values to proper numbers to prevent string concatenation
    // PostgreSQL numeric type can cause issues if strings are passed
    const safeNumber = (val) => {
      if (val === null || val === undefined) return null;
      const num = Number(val);
      if (isNaN(num) || !isFinite(num)) {
        console.error(`[PaperAccountRepository] Invalid numeric value: ${val}`);
        return null;
      }
      return num;
    };
    
    const safeInt = (val) => {
      if (val === null || val === undefined) return null;
      const num = parseInt(val, 10);
      if (isNaN(num) || !isFinite(num)) {
        console.error(`[PaperAccountRepository] Invalid integer value: ${val}`);
        return null;
      }
      return num;
    };
    
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
        safeNumber(stats.currentBalance),
        safeNumber(stats.totalInvested),
        safeNumber(stats.totalProfitLoss),
        safeInt(stats.totalTrades),
        safeInt(stats.winningTrades),
        safeInt(stats.losingTrades)
      ]
    );
    return result.rows[0];
  }

  /**
   * Record account reset
   */
  async recordReset(userId) {
    try {
      // Get current account state first
      const accountResult = await query(
        `SELECT current_balance, total_trades, total_profit_loss 
        FROM paper_accounts WHERE user_id = $1`,
        [userId]
      );
      
      const account = accountResult.rows[0];
      if (!account) {
        throw new Error('Paper account not found');
      }
      
      // Record reset in history (if table exists)
      try {
        await query(
          `INSERT INTO paper_account_resets (
            user_id, balance_before_reset, total_trades_before_reset, 
            profit_loss_before_reset
          ) VALUES ($1, $2, $3, $4)`,
          [userId, account.current_balance, account.total_trades, account.total_profit_loss]
        );
      } catch (resetHistoryError) {
        console.log('[PaperAccountRepository] Reset history table not available:', resetHistoryError.message);
        // Continue without recording history
      }
      
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
      
      return resetResult.rows[0];
    } catch (error) {
      console.error('[PaperAccountRepository] Error in recordReset:', error);
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
    try {
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
    } catch (error) {
      console.log('[PaperAccountRepository] Portfolio snapshots table not available or empty:', error.message);
      return []; // Return empty array if table doesn't exist
    }
  }
}

export default new PaperAccountRepository();
