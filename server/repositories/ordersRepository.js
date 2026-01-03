/**
 * Orders Repository
 * Handles database operations for trading orders and history with PostgreSQL
 */

import { query } from '../config/database.js';

export class OrdersRepository {
  /**
   * Get all orders for a user
   */
  async getOrdersByUserId(userId) {
    const result = await query(
      `SELECT id, user_id as "userId", symbol, name, asset_type as "assetType",
              order_type as "type", quantity, price, total_value as "total",
              status, account, notes, executed_at as "timestamp",
              created_at as "createdAt"
       FROM orders WHERE user_id = $1 ORDER BY executed_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Alias for getOrdersByUserId for compatibility
   */
  async getUserOrders(userId) {
    return this.getOrdersByUserId(userId);
  }

  /**
   * Get orders with filters
   */
  async getOrdersWithFilters(userId, filters = {}) {
    let queryText = `
      SELECT id, user_id as "userId", symbol, name, asset_type as "assetType",
             order_type as "type", quantity, price, total_value as "total",
             status, account, notes, executed_at as "timestamp",
             created_at as "createdAt"
      FROM orders WHERE user_id = $1
    `;
    const params = [userId];
    let paramCount = 2;

    // Filter by asset type
    if (filters.assetType && filters.assetType !== 'all') {
      queryText += ` AND asset_type = $${paramCount}`;
      params.push(filters.assetType);
      paramCount++;
    }

    // Filter by order type (buy/sell)
    if (filters.type && filters.type !== 'all') {
      queryText += ` AND order_type = $${paramCount}`;
      params.push(filters.type);
      paramCount++;
    }

    // Filter by status
    if (filters.status && filters.status !== 'all') {
      queryText += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    // Filter by account
    if (filters.accountId) {
      queryText += ` AND account = $${paramCount}`;
      params.push(filters.accountId);
      paramCount++;
    }

    // Filter by date range
    if (filters.startDate) {
      queryText += ` AND executed_at >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      queryText += ` AND executed_at <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    queryText += ' ORDER BY executed_at DESC';

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId, userId) {
    const result = await query(
      `SELECT id, user_id as "userId", symbol, name, asset_type as "assetType",
              order_type as "type", quantity, price, total_value as "total",
              status, account, notes, executed_at as "timestamp",
              created_at as "createdAt"
       FROM orders WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    );
    return result.rows[0];
  }

  /**
   * Get completed orders (trade history)
   */
  async getTradeHistory(userId) {
    const result = await query(
      `SELECT id, user_id as "userId", symbol, name, asset_type as "assetType",
              order_type as "type", quantity, price, total_value as "total",
              status, account, notes, executed_at as "timestamp",
              created_at as "createdAt"
       FROM orders 
       WHERE user_id = $1 AND status = 'completed'
       ORDER BY executed_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Get pending/open orders
   */
  async getOpenOrders(userId) {
    const result = await query(
      `SELECT id, user_id as "userId", symbol, name, asset_type as "assetType",
              order_type as "type", quantity, price, total_value as "total",
              status, account, notes, executed_at as "timestamp",
              created_at as "createdAt"
       FROM orders 
       WHERE user_id = $1 AND status = 'pending'
       ORDER BY executed_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId, userId) {
    const result = await query(
      `UPDATE orders 
       SET status = 'cancelled'
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING id, user_id as "userId", symbol, name, asset_type as "assetType",
                 order_type as "type", quantity, price, total_value as "total",
                 status, account, notes, executed_at as "timestamp",
                 created_at as "createdAt"`,
      [orderId, userId]
    );

    if (result.rowCount === 0) {
      throw new Error('Order not found or cannot be cancelled');
    }

    return result.rows[0];
  }

  /**
   * Create a new order
   */
  async createOrder(userId, orderData) {
    // CRITICAL: Convert all numeric values to proper numbers to prevent string concatenation
    // PostgreSQL numeric type can cause issues if strings are passed
    const quantity = Number(orderData.quantity);
    const price = Number(orderData.price);
    const totalValue = Number(orderData.totalValue || orderData.total);
    
    // Validate all numeric values
    if (isNaN(quantity) || !isFinite(quantity) || quantity <= 0) {
      throw new Error(`Invalid quantity: ${orderData.quantity}. Must be a positive number.`);
    }
    if (isNaN(price) || !isFinite(price) || price <= 0) {
      throw new Error(`Invalid price: ${orderData.price}. Must be a positive number.`);
    }
    if (isNaN(totalValue) || !isFinite(totalValue) || totalValue <= 0) {
      throw new Error(`Invalid total_value: ${orderData.totalValue || orderData.total}. Must be a positive number.`);
    }
    
    const result = await query(
      `INSERT INTO orders (user_id, symbol, name, asset_type, order_type, quantity, price, total_value, status, account, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, user_id as "userId", symbol, name, asset_type as "assetType",
                 order_type as "type", quantity, price, total_value as "total",
                 status, account, notes, executed_at as "timestamp",
                 created_at as "createdAt"`,
      [
        userId,
        orderData.symbol,
        orderData.name,
        orderData.assetType,
        orderData.orderType || orderData.type,
        quantity,
        price,
        totalValue,
        orderData.status || 'completed',
        orderData.account || orderData.accountName || 'default',
        orderData.notes || null
      ]
    );
    return result.rows[0];
  }
}

export default new OrdersRepository();
