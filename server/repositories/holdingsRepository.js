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
    
    // CRITICAL: Convert all numeric values to JavaScript numbers to prevent string concatenation
    // PostgreSQL numeric type can be returned as strings by the pg driver
    return result.rows.map(holding => {
      const quantity = Number(holding.quantity) || 0;
      const avgBuyPrice = Number(holding.avgBuyPrice) || 0;
      const currentPrice = Number(holding.currentPrice) || avgBuyPrice;
      
      return {
        ...holding,
        quantity,
        avgBuyPrice,
        currentPrice,
        totalValue: quantity * currentPrice,
        profitLoss: quantity * (currentPrice - avgBuyPrice),
        profitLossPercent: avgBuyPrice > 0 
          ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 
          : 0
      };
    });
  }

  /**
   * Get ONLY paper trading holdings for a user
   * This is used by the paper trading service to ensure complete isolation
   */
  async getPaperTradingHoldings(userId) {
    const result = await query(
      `SELECT id, user_id as "userId", symbol, name, asset_type as "assetType", 
              quantity, average_buy_price as "avgBuyPrice", current_price as "currentPrice",
              account, notes, created_at as "createdAt", updated_at as "updatedAt"
       FROM holdings WHERE user_id = $1 AND account = 'paper' ORDER BY created_at DESC`,
      [userId]
    );
    
    // CRITICAL: Convert all numeric values to JavaScript numbers to prevent string concatenation
    // PostgreSQL numeric type can be returned as strings by the pg driver
    return result.rows.map(holding => {
      const quantity = Number(holding.quantity) || 0;
      const avgBuyPrice = Number(holding.avgBuyPrice) || 0;
      const currentPrice = Number(holding.currentPrice) || avgBuyPrice;
      
      return {
        ...holding,
        quantity,
        avgBuyPrice,
        currentPrice,
        totalValue: quantity * currentPrice,
        profitLoss: quantity * (currentPrice - avgBuyPrice),
        profitLossPercent: avgBuyPrice > 0 
          ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 
          : 0
      };
    });
  }

  /**
   * Get ONLY non-paper trading holdings for a user (for real portfolio)
   * This excludes paper trading holdings
   */
  async getRealHoldings(userId) {
    const result = await query(
      `SELECT id, user_id as "userId", symbol, name, asset_type as "assetType", 
              quantity, average_buy_price as "avgBuyPrice", current_price as "currentPrice",
              account, notes, created_at as "createdAt", updated_at as "updatedAt"
       FROM holdings WHERE user_id = $1 AND (account IS NULL OR account != 'paper') ORDER BY created_at DESC`,
      [userId]
    );
    
    // CRITICAL: Convert all numeric values to JavaScript numbers to prevent string concatenation
    // PostgreSQL numeric type can be returned as strings by the pg driver
    return result.rows.map(holding => {
      const quantity = Number(holding.quantity) || 0;
      const avgBuyPrice = Number(holding.avgBuyPrice) || 0;
      const currentPrice = Number(holding.currentPrice) || avgBuyPrice;
      
      return {
        ...holding,
        quantity,
        avgBuyPrice,
        currentPrice,
        totalValue: quantity * currentPrice,
        profitLoss: quantity * (currentPrice - avgBuyPrice),
        profitLossPercent: avgBuyPrice > 0 
          ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 
          : 0
      };
    });
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

    // CRITICAL: Convert all numeric values to JavaScript numbers
    return result.rows.map(holding => {
      const quantity = Number(holding.quantity) || 0;
      const avgBuyPrice = Number(holding.avgBuyPrice) || 0;
      const currentPrice = Number(holding.currentPrice) || avgBuyPrice;
      
      return {
        ...holding,
        quantity,
        avgBuyPrice,
        currentPrice,
        totalValue: quantity * currentPrice,
        profitLoss: quantity * (currentPrice - avgBuyPrice),
        profitLossPercent: avgBuyPrice > 0
          ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100
          : 0
      };
    });
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

    // CRITICAL: Convert all numeric values to JavaScript numbers
    return result.rows.map(holding => {
      const quantity = Number(holding.quantity) || 0;
      const avgBuyPrice = Number(holding.avgBuyPrice) || 0;
      const currentPrice = Number(holding.currentPrice) || avgBuyPrice;
      
      return {
        ...holding,
        quantity,
        avgBuyPrice,
        currentPrice,
        totalValue: quantity * currentPrice,
        profitLoss: quantity * (currentPrice - avgBuyPrice),
        profitLossPercent: avgBuyPrice > 0
          ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100
          : 0
      };
    });
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
    // Ensure all numeric values are properly parsed - use Number() for strict parsing
    const quantity = Number(holdingData.quantity);
    const avgBuyPrice = Number(holdingData.avgBuyPrice);
    const currentPrice = Number(holdingData.currentPrice || holdingData.avgBuyPrice);
    
    // Validate numbers with isFinite check
    if (isNaN(quantity) || quantity <= 0 || !isFinite(quantity)) {
      throw new Error(`Invalid quantity: ${holdingData.quantity}`);
    }
    if (isNaN(avgBuyPrice) || avgBuyPrice <= 0 || !isFinite(avgBuyPrice)) {
      throw new Error(`Invalid avgBuyPrice: ${holdingData.avgBuyPrice}`);
    }
    if (isNaN(currentPrice) || currentPrice <= 0 || !isFinite(currentPrice)) {
      throw new Error(`Invalid currentPrice: ${holdingData.currentPrice}`);
    }
    
    console.log('[HoldingsRepository] Creating holding:', {
      userId,
      symbol: holdingData.symbol,
      quantity,
      avgBuyPrice,
      currentPrice,
      account: holdingData.account || 'default'
    });
    
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
        quantity,  // Use parsed number
        avgBuyPrice,  // Use parsed number
        currentPrice,  // Use parsed number
        holdingData.account || 'default',
        holdingData.notes || null
      ]
    );
    
    console.log('[HoldingsRepository] Created holding:', result.rows[0]);
    return result.rows[0];
  }

  /**
   * Update existing holding
   */
  async updateHolding(holdingId, userId, holdingData) {
    // Ensure all numeric values are properly parsed - use Number() for strict parsing
    const quantity = Number(holdingData.quantity);
    const avgBuyPrice = Number(holdingData.avgBuyPrice);
    const currentPrice = Number(holdingData.currentPrice || holdingData.avgBuyPrice);
    
    // Validate numbers with isFinite check
    if (isNaN(quantity) || quantity < 0 || !isFinite(quantity)) {
      throw new Error(`Invalid quantity: ${holdingData.quantity}`);
    }
    if (isNaN(avgBuyPrice) || avgBuyPrice <= 0 || !isFinite(avgBuyPrice)) {
      throw new Error(`Invalid avgBuyPrice: ${holdingData.avgBuyPrice}`);
    }
    if (isNaN(currentPrice) || currentPrice <= 0 || !isFinite(currentPrice)) {
      throw new Error(`Invalid currentPrice: ${holdingData.currentPrice}`);
    }
    
    console.log('[HoldingsRepository] Updating holding:', {
      holdingId,
      userId,
      symbol: holdingData.symbol,
      quantity,
      avgBuyPrice,
      currentPrice
    });
    
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
        quantity,  // Use parsed number
        avgBuyPrice,  // Use parsed number
        currentPrice,  // Use parsed number
        holdingData.account || 'default',
        holdingData.notes || null
      ]
    );
    
    console.log('[HoldingsRepository] Updated holding:', result.rows[0]);
    return result.rows[0];
  }

  /**
   * Merge duplicate holding (for when user adds same symbol/type)
   */
  async mergeHolding(existingHolding, newQuantity, newAvgPrice) {
    // CRITICAL: Ensure all values are numbers to prevent string concatenation
    const existingQty = Number(existingHolding.quantity) || 0;
    const existingAvg = Number(existingHolding.avgBuyPrice) || 0;
    const addQty = Number(newQuantity) || 0;
    const addAvg = Number(newAvgPrice) || 0;
    
    const totalQuantity = existingQty + addQty;
    const mergedAvgPrice = totalQuantity > 0
      ? ((existingQty * existingAvg) + (addQty * addAvg)) / totalQuantity
      : 0;

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

    const holdings = result.rows.map(holding => {
      // CRITICAL: Convert all numeric values to JavaScript numbers
      const quantity = Number(holding.quantity) || 0;
      const avgBuyPrice = Number(holding.avgBuyPrice) || 0;
      const currentPrice = Number(holding.currentPrice) || avgBuyPrice;
      
      return {
        ...holding,
        quantity,
        avgBuyPrice,
        currentPrice,
        totalValue: quantity * currentPrice,
        profitLoss: quantity * (currentPrice - avgBuyPrice),
        profitLossPercent: avgBuyPrice > 0
          ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100
          : 0
      };
    });

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
