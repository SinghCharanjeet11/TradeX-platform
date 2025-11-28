/**
 * Holdings Repository
 * Data access layer for portfolio holdings with PostgreSQL
 */

import { query } from '../config/database.js';

class HoldingsRepository {
  /**
   * Get all holdings for a user
   */
  async getUserHoldings(userId) {
    const result = await query(
      `SELECT id, user_id as "userId", symbol, name, asset_type as "assetType", 
              quantity, average_buy_price as "avgBuyPrice", current_price as "currentPrice",
              account, notes, created_at as "createdAt", updated_at as "updatedAt"
       FROM holdings WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    
    // Calculate derived fields
    return result.rows.map(holding => ({
      ...holding,
      totalValue: holding.quantity * (holding.currentPrice || holding.avgBuyPrice),
      profitLoss: holding.quantity * ((holding.currentPrice || holding.avgBuyPrice) - holding.avgBuyPrice),
      profitLossPercent: holding.avgBuyPrice > 0 
        ? (((holding.currentPrice || holding.avgBuyPrice) - holding.avgBuyPrice) / holding.avgBuyPrice) * 100 
        : 0
    }));
  }

  /**
   * Get holdings by asset type
   */
  async getHoldingsByType(userId, assetType) {
    if (!assetType || assetType === 'all') {
      return this.getUserHoldings(userId);
    }

    const result = await query(
      `SELECT id, user_id as "userId", symbol, name, asset_type as "assetType",
              quantity, average_buy_price as "avgBuyPrice", current_price as "currentPrice",
              account, notes, created_at as "createdAt", updated_at as "updatedAt"
       FROM holdings WHERE user_id = $1 AND asset_type = $2 ORDER BY created_at DESC`,
      [userId, assetType]
    );

    return result.rows.map(holding => ({
      ...holding,
      totalValue: holding.quantity * (holding.currentPrice || holding.avgBuyPrice),
      profitLoss: holding.quantity * ((holding.currentPrice || holding.avgBuyPrice) - holding.avgBuyPrice),
      profitLossPercent: holding.avgBuyPrice > 0
        ? (((holding.currentPrice || holding.avgBuyPrice) - holding.avgBuyPrice) / holding.avgBuyPrice) * 100
        : 0
    }));
  }

  /**
   * Get holding by ID
   */
  async getHoldingById(holdingId) {
    const result = await query(
      `SELECT id, user_id as "userId", symbol, name, asset_type as "assetType",
              quantity, average_buy_price as "avgBuyPrice", current_price as "currentPrice",
              account, notes, created_at as "createdAt", updated_at as "updatedAt"
       FROM holdings WHERE id = $1`,
      [holdingId]
    );
    return result.rows[0];
  }

  /**
   * Search holdings
   */
  async searchHoldings(userId, searchQuery) {
    if (!searchQuery) {
      return this.getUserHoldings(userId);
    }

    const result = await query(
      `SELECT id, user_id as "userId", symbol, name, asset_type as "assetType",
              quantity, average_buy_price as "avgBuyPrice", current_price as "currentPrice",
              account, notes, created_at as "createdAt", updated_at as "updatedAt"
       FROM holdings 
       WHERE user_id = $1 AND (LOWER(symbol) LIKE $2 OR LOWER(name) LIKE $2)
       ORDER BY created_at DESC`,
      [userId, `%${searchQuery.toLowerCase()}%`]
    );

    return result.rows.map(holding => ({
      ...holding,
      totalValue: holding.quantity * (holding.currentPrice || holding.avgBuyPrice),
      profitLoss: holding.quantity * ((holding.currentPrice || holding.avgBuyPrice) - holding.avgBuyPrice),
      profitLossPercent: holding.avgBuyPrice > 0
        ? (((holding.currentPrice || holding.avgBuyPrice) - holding.avgBuyPrice) / holding.avgBuyPrice) * 100
        : 0
    }));
  }

  /**
   * Check if duplicate holding exists
   */
  async checkDuplicateHolding(userId, symbol, assetType) {
    const result = await query(
      `SELECT id, user_id as "userId", symbol, name, asset_type as "assetType",
              quantity, average_buy_price as "avgBuyPrice", current_price as "currentPrice",
              account, notes
       FROM holdings 
       WHERE user_id = $1 AND LOWER(symbol) = LOWER($2) AND asset_type = $3`,
      [userId, symbol, assetType]
    );
    return result.rows[0];
  }

  /**
   * Create new holding
   */
  async createHolding(userId, holdingData) {
    const result = await query(
      `INSERT INTO holdings (user_id, symbol, name, asset_type, quantity, average_buy_price, current_price, account, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, user_id as "userId", symbol, name, asset_type as "assetType",
                 quantity, average_buy_price as "avgBuyPrice", current_price as "currentPrice",
                 account, notes, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        userId,
        holdingData.symbol,
        holdingData.name,
        holdingData.assetType,
        holdingData.quantity,
        holdingData.avgBuyPrice,
        holdingData.currentPrice || holdingData.avgBuyPrice,
        holdingData.account || 'default',
        holdingData.notes || null
      ]
    );
    return result.rows[0];
  }

  /**
   * Update existing holding
   */
  async updateHolding(holdingId, userId, holdingData) {
    const result = await query(
      `UPDATE holdings 
       SET symbol = $3,
           name = $4,
           asset_type = $5,
           quantity = $6,
           average_buy_price = $7,
           current_price = $8,
           account = $9,
           notes = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id as "userId", symbol, name, asset_type as "assetType",
                 quantity, average_buy_price as "avgBuyPrice", current_price as "currentPrice",
                 account, notes, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        holdingId,
        userId,
        holdingData.symbol,
        holdingData.name,
        holdingData.assetType,
        holdingData.quantity,
        holdingData.avgBuyPrice,
        holdingData.currentPrice || holdingData.avgBuyPrice,
        holdingData.account || 'default',
        holdingData.notes || null
      ]
    );
    return result.rows[0];
  }

  /**
   * Merge duplicate holding (for when user adds same symbol/type)
   */
  async mergeHolding(existingHolding, newQuantity, newAvgPrice) {
    const totalQuantity = existingHolding.quantity + newQuantity;
    const mergedAvgPrice = 
      ((existingHolding.quantity * existingHolding.avgBuyPrice) + (newQuantity * newAvgPrice)) / totalQuantity;

    const result = await query(
      `UPDATE holdings 
       SET quantity = $2,
           average_buy_price = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, user_id as "userId", symbol, name, asset_type as "assetType",
                 quantity, average_buy_price as "avgBuyPrice", current_price as "currentPrice",
                 account, notes, created_at as "createdAt", updated_at as "updatedAt"`,
      [existingHolding.id, totalQuantity, mergedAvgPrice]
    );
    return result.rows[0];
  }

  /**
   * Bulk delete holdings
   */
  async bulkDeleteHoldings(holdingIds, userId) {
    const result = await query(
      'DELETE FROM holdings WHERE id = ANY($1::int[]) AND user_id = $2',
      [holdingIds, userId]
    );
    return result.rowCount;
  }

  /**
   * Create or update holding (legacy method - kept for compatibility)
   */
  async upsertHolding(userId, holdingData) {
    const result = await query(
      `INSERT INTO holdings (user_id, symbol, name, asset_type, quantity, average_buy_price, current_price, account, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, symbol, asset_type) 
       DO UPDATE SET 
         quantity = holdings.quantity + EXCLUDED.quantity,
         average_buy_price = ((holdings.quantity * holdings.average_buy_price) + (EXCLUDED.quantity * EXCLUDED.average_buy_price)) / (holdings.quantity + EXCLUDED.quantity),
         current_price = EXCLUDED.current_price,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, holdingData.symbol, holdingData.name, holdingData.assetType, holdingData.quantity, holdingData.avgBuyPrice, holdingData.currentPrice, holdingData.account || 'default', holdingData.notes]
    );
    return result.rows[0];
  }

  /**
   * Update holding price
   */
  async updateHoldingPrice(holdingId, currentPrice) {
    const result = await query(
      'UPDATE holdings SET current_price = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [currentPrice, holdingId]
    );
    return result.rows[0];
  }

  /**
   * Delete holding
   */
  async deleteHolding(holdingId, userId) {
    const result = await query(
      'DELETE FROM holdings WHERE id = $1 AND user_id = $2',
      [holdingId, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Get holdings with pagination
   */
  async getHoldingsPaginated(userId, filters = {}, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    let whereClause = 'WHERE user_id = $1';
    let params = [userId];
    let paramIndex = 2;

    // Add asset type filter
    if (filters.assetType && filters.assetType !== 'all') {
      whereClause += ` AND asset_type = $${paramIndex}`;
      params.push(filters.assetType);
      paramIndex++;
    }

    // Add search filter
    if (filters.search) {
      whereClause += ` AND (LOWER(symbol) LIKE $${paramIndex} OR LOWER(name) LIKE $${paramIndex})`;
      params.push(`%${filters.search.toLowerCase()}%`);
      paramIndex++;
    }

    // Build ORDER BY clause
    let orderBy = 'ORDER BY created_at DESC';
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
      const sortColumn = this._mapSortColumn(filters.sortBy);
      orderBy = `ORDER BY ${sortColumn} ${sortOrder}`;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM holdings ${whereClause}`,
      params
    );
    const totalItems = parseInt(countResult.rows[0].total);

    // Get paginated results
    const result = await query(
      `SELECT id, user_id as "userId", symbol, name, asset_type as "assetType",
              quantity, average_buy_price as "avgBuyPrice", current_price as "currentPrice",
              account, notes, created_at as "createdAt", updated_at as "updatedAt"
       FROM holdings 
       ${whereClause}
       ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, offset]
    );

    const holdings = result.rows.map(holding => ({
      ...holding,
      totalValue: holding.quantity * (holding.currentPrice || holding.avgBuyPrice),
      profitLoss: holding.quantity * ((holding.currentPrice || holding.avgBuyPrice) - holding.avgBuyPrice),
      profitLossPercent: holding.avgBuyPrice > 0
        ? (((holding.currentPrice || holding.avgBuyPrice) - holding.avgBuyPrice) / holding.avgBuyPrice) * 100
        : 0
    }));

    return {
      holdings,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize)
      }
    };
  }

  /**
   * Map frontend sort column names to database column names
   */
  _mapSortColumn(sortBy) {
    const columnMap = {
      symbol: 'symbol',
      name: 'name',
      assetType: 'asset_type',
      quantity: 'quantity',
      avgBuyPrice: 'average_buy_price',
      currentPrice: 'current_price',
      account: 'account',
      createdAt: 'created_at'
    };
    return columnMap[sortBy] || 'created_at';
  }
}

export default new HoldingsRepository();
