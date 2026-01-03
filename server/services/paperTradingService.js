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
   * Update current prices for holdings from market data
   */
  async _updateHoldingPrices(holdings) {
    try {
      console.log('[PaperTradingService] Updating prices for', holdings.length, 'holdings');
      
      // Import market service dynamically to avoid circular dependency
      const marketService = (await import('./marketService.js')).default;
      
      // Group holdings by asset type for efficient price fetching
      const cryptoHoldings = holdings.filter(h => h.assetType === 'crypto');
      const stockHoldings = holdings.filter(h => h.assetType === 'stocks');
      const forexHoldings = holdings.filter(h => h.assetType === 'forex');
      const commodityHoldings = holdings.filter(h => h.assetType === 'commodities');
      
      // Update crypto prices
      if (cryptoHoldings.length > 0) {
        try {
          const cryptoResponse = await marketService.getCryptoMarketData();
          if (cryptoResponse.success && cryptoResponse.data) {
            const cryptoMap = new Map(
              cryptoResponse.data.map(c => [c.symbol.toUpperCase(), c.price])
            );
            
            for (const holding of cryptoHoldings) {
              const marketPrice = cryptoMap.get(holding.symbol.toUpperCase());
              if (marketPrice && marketPrice > 0) {
                await holdingsRepository.updateHoldingPrice(holding.id, marketPrice);
                console.log(`[PaperTradingService] Updated ${holding.symbol}: ${marketPrice}`);
              }
            }
          }
        } catch (error) {
          console.error('[PaperTradingService] Error updating crypto prices:', error.message);
        }
      }
      
      // Update stock prices
      if (stockHoldings.length > 0) {
        try {
          const stocksResponse = await marketService.getStocksMarketData();
          if (stocksResponse.success && stocksResponse.data) {
            const stocksMap = new Map(
              stocksResponse.data.map(s => [s.symbol.toUpperCase(), s.price])
            );
            
            for (const holding of stockHoldings) {
              const marketPrice = stocksMap.get(holding.symbol.toUpperCase());
              if (marketPrice && marketPrice > 0) {
                await holdingsRepository.updateHoldingPrice(holding.id, marketPrice);
                console.log(`[PaperTradingService] Updated ${holding.symbol}: ${marketPrice}`);
              }
            }
          }
        } catch (error) {
          console.error('[PaperTradingService] Error updating stock prices:', error.message);
        }
      }
      
      // Update forex prices
      if (forexHoldings.length > 0) {
        try {
          const forexResponse = await marketService.getForexMarketData();
          if (forexResponse.success && forexResponse.data) {
            const forexMap = new Map(
              forexResponse.data.map(f => [f.symbol.toUpperCase().replace('/', ''), f.price])
            );
            
            for (const holding of forexHoldings) {
              const normalizedSymbol = holding.symbol.toUpperCase().replace('/', '');
              const marketPrice = forexMap.get(normalizedSymbol);
              if (marketPrice && marketPrice > 0) {
                await holdingsRepository.updateHoldingPrice(holding.id, marketPrice);
                console.log(`[PaperTradingService] Updated ${holding.symbol}: ${marketPrice}`);
              }
            }
          }
        } catch (error) {
          console.error('[PaperTradingService] Error updating forex prices:', error.message);
        }
      }
      
      // Update commodity prices
      if (commodityHoldings.length > 0) {
        try {
          const commoditiesResponse = await marketService.getCommoditiesMarketData();
          if (commoditiesResponse.success && commoditiesResponse.data) {
            const commoditiesMap = new Map(
              commoditiesResponse.data.map(c => [c.symbol.toUpperCase(), c.price])
            );
            
            for (const holding of commodityHoldings) {
              const marketPrice = commoditiesMap.get(holding.symbol.toUpperCase());
              if (marketPrice && marketPrice > 0) {
                await holdingsRepository.updateHoldingPrice(holding.id, marketPrice);
                console.log(`[PaperTradingService] Updated ${holding.symbol}: ${marketPrice}`);
              }
            }
          }
        } catch (error) {
          console.error('[PaperTradingService] Error updating commodity prices:', error.message);
        }
      }
      
      console.log('[PaperTradingService] Price update complete');
    } catch (error) {
      console.error('[PaperTradingService] Error in _updateHoldingPrices:', error);
      // Don't throw - price updates are best-effort
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

      // Get ONLY paper trading holdings (using dedicated method for isolation)
      const paperHoldings = await holdingsRepository.getPaperTradingHoldings(userId);

      // Update prices for all holdings to get current market prices
      if (paperHoldings.length > 0) {
        await this._updateHoldingPrices(paperHoldings);
        // Re-fetch holdings after price update
        const updatedHoldings = await holdingsRepository.getPaperTradingHoldings(userId);
        paperHoldings.length = 0;
        paperHoldings.push(...updatedHoldings);
      }

      console.log('[PaperTradingService] ===== P/L CALCULATION DEBUG =====');
      console.log('[PaperTradingService] Number of paper holdings:', paperHoldings.length);
      console.log('[PaperTradingService] Account totalProfitLoss from DB:', account.totalProfitLoss);

      // Calculate portfolio value AND unrealized P/L with proper number conversion
      let portfolioValue = 0;
      let unrealizedProfitLoss = 0;
      
      paperHoldings.forEach(h => {
        const quantity = Number(h.quantity) || 0;
        // CRITICAL: Use currentPrice if available, otherwise use avgBuyPrice
        // This means if currentPrice === avgBuyPrice, unrealized P/L will be 0
        const currentPrice = Number(h.currentPrice) || Number(h.avgBuyPrice) || 0;
        const avgBuyPrice = Number(h.avgBuyPrice) || 0;
        
        const value = quantity * currentPrice;
        const unrealizedPL = (currentPrice - avgBuyPrice) * quantity;
        
        portfolioValue += value;
        unrealizedProfitLoss += unrealizedPL;
        
        console.log('[PaperTradingService] Holding:', {
          symbol: h.symbol,
          quantity,
          avgBuyPrice,
          currentPrice,
          priceChanged: currentPrice !== avgBuyPrice,
          value: value.toFixed(2),
          unrealizedPL: unrealizedPL.toFixed(2)
        });
      });

      // Ensure all values are proper numbers
      const currentBalance = Number(account.currentBalance) || 0;
      const initialBalance = Number(account.initialBalance) || 100000;
      const realizedProfitLoss = Number(account.totalProfitLoss) || 0;
      
      // Total P/L = Realized P/L (from completed trades) + Unrealized P/L (from current holdings)
      const totalProfitLoss = realizedProfitLoss + unrealizedProfitLoss;

      // Calculate total value
      const totalValue = currentBalance + portfolioValue;

      console.log('[PaperTradingService] ===== FINAL CALCULATIONS =====');
      console.log('[PaperTradingService] Current Balance:', currentBalance.toFixed(2));
      console.log('[PaperTradingService] Portfolio Value:', portfolioValue.toFixed(2));
      console.log('[PaperTradingService] Total Value:', totalValue.toFixed(2));
      console.log('[PaperTradingService] Initial Balance:', initialBalance.toFixed(2));
      console.log('[PaperTradingService] Realized P/L:', realizedProfitLoss.toFixed(2));
      console.log('[PaperTradingService] Unrealized P/L:', unrealizedProfitLoss.toFixed(2));
      console.log('[PaperTradingService] Total P/L:', totalProfitLoss.toFixed(2));
      console.log('[PaperTradingService] =====================================');

      // Calculate profit/loss percentage
      const profitLossPercent = initialBalance > 0
        ? ((totalValue - initialBalance) / initialBalance) * 100
        : 0;

      // Calculate win rate
      const totalTrades = parseInt(account.totalTrades) || 0;
      const winningTrades = parseInt(account.winningTrades) || 0;
      const winRate = totalTrades > 0
        ? (winningTrades / totalTrades) * 100
        : 0;

      return {
        ...account,
        currentBalance,
        initialBalance,
        totalProfitLoss,
        realizedProfitLoss,
        unrealizedProfitLoss,
        portfolioValue,
        totalValue,
        profitLossPercent,
        winRate,
        totalTrades,
        winningTrades,
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
        // Use dedicated paper trading holdings method for isolation
        const holdings = await holdingsRepository.getPaperTradingHoldings(userId);
        
        console.log('[PaperTradingService] Sell validation - paper holdings:', 
          holdings.map(h => ({
            id: h.id,
            symbol: h.symbol,
            quantity: h.quantity,
            assetType: h.assetType,
            account: h.account
          }))
        );

        // Normalize symbol for comparison (trim and uppercase)
        const normalizedSymbol = symbol.toUpperCase().trim();
        
        const holding = holdings.find(h => 
          h.symbol.toUpperCase().trim() === normalizedSymbol && 
          h.assetType === assetType
        );

        console.log('[PaperTradingService] Sell validation:', {
          symbol: normalizedSymbol,
          assetType,
          requestedQuantity: quantity,
          holding: holding ? {
            id: holding.id,
            symbol: holding.symbol,
            quantity: holding.quantity,
            assetType: holding.assetType,
            account: holding.account
          } : null
        });

        if (!holding) {
          return {
            valid: false,
            error: `No holdings found for ${symbol}. You must own this asset before selling.`
          };
        }

        const availableQuantity = Number(holding.quantity) || 0;
        const requestedQuantity = Number(quantity) || 0;

        console.log('[PaperTradingService] Quantity check:', {
          availableQuantity,
          requestedQuantity,
          sufficient: availableQuantity >= requestedQuantity
        });

        if (availableQuantity < requestedQuantity) {
          return {
            valid: false,
            error: `Insufficient holdings. Required: ${requestedQuantity.toFixed(8)}, Available: ${availableQuantity.toFixed(8)}`
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
      // Parse and validate numeric values FIRST - use Number() for strict parsing
      const quantity = Number(orderData.quantity);
      const price = Number(orderData.price);
      
      // Strict validation - reject invalid numbers
      if (isNaN(quantity) || quantity <= 0 || !isFinite(quantity)) {
        throw new Error(`Invalid quantity: ${orderData.quantity}. Must be a positive number.`);
      }
      
      if (isNaN(price) || price <= 0 || !isFinite(price)) {
        throw new Error(`Invalid price: ${orderData.price}. Must be a positive number.`);
      }
      
      console.log('[PaperTradingService] Parsed order values:', {
        quantity,
        price,
        quantityType: typeof quantity,
        priceType: typeof price
      });
      
      // Create validated order data with parsed numbers
      const validatedOrderData = {
        ...orderData,
        quantity,
        price
      };
      
      // Validate order
      const validation = await this.validateOrder(userId, validatedOrderData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const { orderType, symbol, name, assetType } = validatedOrderData;
      const totalValue = quantity * price;

      console.log('[PaperTradingService] Executing order:', {
        orderType,
        symbol,
        quantity,
        price,
        totalValue,
        assetType
      });

      // Get account
      const account = await paperAccountRepository.getAccountByUserId(userId);
      
      // CRITICAL: Convert all account values to numbers to prevent string concatenation
      // PostgreSQL numeric type can be returned as strings by the pg driver
      const accountCurrentBalance = Number(account.currentBalance) || 0;
      const accountTotalInvested = Number(account.totalInvested) || 0;
      const accountTotalProfitLoss = Number(account.totalProfitLoss) || 0;
      const accountTotalTrades = parseInt(account.totalTrades) || 0;
      const accountWinningTrades = parseInt(account.winningTrades) || 0;
      const accountLosingTrades = parseInt(account.losingTrades) || 0;
      
      console.log('[PaperTradingService] Account values (converted to numbers):', {
        currentBalance: accountCurrentBalance,
        totalInvested: accountTotalInvested,
        totalProfitLoss: accountTotalProfitLoss,
        totalTrades: accountTotalTrades
      });

      // Execute buy order
      if (orderType === 'buy') {
        // Deduct from balance
        const newBalance = accountCurrentBalance - totalValue;
        await paperAccountRepository.updateBalance(userId, newBalance);

        // Add or update holding - use dedicated paper trading holdings method
        const holdings = await holdingsRepository.getPaperTradingHoldings(userId);
        const normalizedSymbol = symbol.toUpperCase().trim();
        const existingHolding = holdings.find(h => 
          h.symbol.toUpperCase().trim() === normalizedSymbol && 
          h.assetType === assetType
        );

        console.log('[PaperTradingService] Buy order - existing holding check:', {
          symbol: normalizedSymbol,
          assetType,
          existingHolding: existingHolding ? {
            id: existingHolding.id,
            symbol: existingHolding.symbol,
            quantity: existingHolding.quantity,
            account: existingHolding.account
          } : null
        });

        if (existingHolding) {
          // Update existing holding
          // CRITICAL: Ensure all values are numbers to prevent string concatenation
          const existingQty = Number(existingHolding.quantity) || 0;
          const existingAvg = Number(existingHolding.avgBuyPrice) || 0;
          
          // Validate that existingQty is actually a number
          if (!isFinite(existingQty) || existingQty < 0) {
            console.error('[PaperTradingService] ❌ Invalid existing quantity:', existingHolding.quantity);
            throw new Error(`Invalid existing quantity in database: ${existingHolding.quantity}`);
          }
          
          const newQuantity = existingQty + quantity;  // quantity already parsed as number at start of function
          
          // Validate the result is a valid number (catches string concatenation)
          if (!isFinite(newQuantity) || newQuantity <= 0) {
            console.error('[PaperTradingService] ❌ Invalid new quantity after addition:', {
              existingQty,
              addedQty: quantity,
              result: newQuantity,
              existingQtyType: typeof existingQty,
              addedQtyType: typeof quantity
            });
            throw new Error(`Invalid quantity calculation: ${existingQty} + ${quantity} = ${newQuantity}`);
          }
          
          const newAvgPrice = ((existingQty * existingAvg) + (quantity * price)) / newQuantity;
          
          console.log('[PaperTradingService] Updating holding:', {
            existingQty,
            newQty: quantity,
            totalQty: newQuantity,
            existingAvg,
            newAvgPrice
          });

          const updated = await holdingsRepository.updateHolding(existingHolding.id, userId, {
            symbol: existingHolding.symbol,
            name: existingHolding.name,
            assetType: existingHolding.assetType,
            quantity: newQuantity,
            avgBuyPrice: newAvgPrice,
            currentPrice: price,  // price already parsed
            account: 'paper',
            notes: existingHolding.notes
          });

          console.log('[PaperTradingService] Updated holding result:', updated);
        } else {
          // Create new holding
          console.log('[PaperTradingService] Creating new holding:', {
            symbol: normalizedSymbol,
            name,
            assetType,
            quantity,
            price,
            account: 'paper'
          });

          try {
            const newHolding = await holdingsRepository.createHolding(userId, {
              symbol: normalizedSymbol,
              name,
              assetType,
              quantity: quantity,  // Already parsed as float above
              avgBuyPrice: price,  // Already parsed as float above
              currentPrice: price,  // Already parsed as float above
              account: 'paper'
            });

            console.log('[PaperTradingService] Created holding:', newHolding);
          } catch (createError) {
            console.error('[PaperTradingService] Error creating holding:', createError);
            // If creation fails due to unique constraint, try to update instead
            if (createError.message && createError.message.includes('duplicate')) {
              console.log('[PaperTradingService] Duplicate detected, fetching and updating...');
              const holdings = await holdingsRepository.getPaperTradingHoldings(userId);
              const holding = holdings.find(h => 
                h.symbol.toUpperCase().trim() === normalizedSymbol && 
                h.assetType === assetType
              );
              
              if (holding) {
                // CRITICAL: Ensure all values are numbers to prevent string concatenation
                const existingQty = Number(holding.quantity) || 0;
                const existingAvg = Number(holding.avgBuyPrice) || 0;
                
                // Validate existing quantity
                if (!isFinite(existingQty) || existingQty < 0) {
                  console.error('[PaperTradingService] ❌ Invalid existing quantity in duplicate handling:', holding.quantity);
                  throw new Error(`Invalid existing quantity: ${holding.quantity}`);
                }
                
                const newQuantity = existingQty + quantity;
                
                // Validate the result
                if (!isFinite(newQuantity) || newQuantity <= 0) {
                  console.error('[PaperTradingService] ❌ Invalid new quantity in duplicate handling:', {
                    existingQty,
                    addedQty: quantity,
                    result: newQuantity
                  });
                  throw new Error(`Invalid quantity calculation: ${existingQty} + ${quantity} = ${newQuantity}`);
                }
                
                const newAvgPrice = ((existingQty * existingAvg) + (quantity * price)) / newQuantity;
                
                await holdingsRepository.updateHolding(holding.id, userId, {
                  symbol: holding.symbol,
                  name: holding.name,
                  assetType: holding.assetType,
                  quantity: newQuantity,
                  avgBuyPrice: newAvgPrice,
                  currentPrice: price,
                  account: 'paper',
                  notes: holding.notes
                });
                console.log('[PaperTradingService] Updated holding after duplicate error');
              }
            } else {
              throw createError;
            }
          }
        }

        // Update account stats
        await paperAccountRepository.updateStatistics(userId, {
          totalInvested: accountTotalInvested + totalValue,
          totalTrades: accountTotalTrades + 1
        });
      }

      // Execute sell order
      if (orderType === 'sell') {
        // Add to balance
        const newBalance = accountCurrentBalance + totalValue;
        await paperAccountRepository.updateBalance(userId, newBalance);

        // Update or remove holding - use dedicated paper trading holdings method
        const holdings = await holdingsRepository.getPaperTradingHoldings(userId);
        const normalizedSymbol = symbol.toUpperCase().trim();
        const holding = holdings.find(h => 
          h.symbol.toUpperCase().trim() === normalizedSymbol && 
          h.assetType === assetType
        );

        if (!holding) {
          throw new Error(`Holding not found for ${symbol}`);
        }

        // CRITICAL: Ensure all values are numbers to prevent string concatenation
        const holdingQuantity = Number(holding.quantity) || 0;
        const holdingAvgBuyPrice = Number(holding.avgBuyPrice) || 0;
        
        // Validate holding quantity
        if (!isFinite(holdingQuantity) || holdingQuantity <= 0) {
          console.error('[PaperTradingService] ❌ Invalid holding quantity for sell:', holding.quantity);
          throw new Error(`Invalid holding quantity: ${holding.quantity}`);
        }
        
        const profitLoss = (price - holdingAvgBuyPrice) * quantity;  // quantity and price already parsed as numbers
        const isWinningTrade = profitLoss > 0;

        console.log('[PaperTradingService] Executing sell:', {
          symbol,
          holdingQuantity,
          sellQuantity: quantity,
          remaining: holdingQuantity - quantity,
          avgBuyPrice: holdingAvgBuyPrice,
          sellPrice: price,
          profitLoss,
          isWinningTrade
        });

        if (Math.abs(holdingQuantity - quantity) < 0.00000001) {
          // Remove holding completely (accounting for floating point precision)
          await holdingsRepository.deleteHolding(holding.id, userId);
        } else {
          // Reduce quantity
          const newQuantity = holdingQuantity - quantity;
          await holdingsRepository.updateHolding(holding.id, userId, {
            ...holding,
            quantity: newQuantity,
            currentPrice: price  // price already parsed
          });
        }

        // Update account stats - use the pre-converted number values
        const newTotalInvested = Math.max(0, accountTotalInvested - (holdingAvgBuyPrice * quantity));
        const newTotalProfitLoss = accountTotalProfitLoss + profitLoss;
        
        console.log('[PaperTradingService] Updating account stats:', {
          oldTotalInvested: accountTotalInvested,
          deduction: holdingAvgBuyPrice * quantity,
          newTotalInvested,
          oldTotalProfitLoss: accountTotalProfitLoss,
          profitLoss,
          newTotalProfitLoss
        });
        
        await paperAccountRepository.updateStatistics(userId, {
          totalInvested: newTotalInvested,
          totalProfitLoss: newTotalProfitLoss,
          totalTrades: accountTotalTrades + 1,
          winningTrades: accountWinningTrades + (isWinningTrade ? 1 : 0),
          losingTrades: accountLosingTrades + (isWinningTrade ? 0 : 1)
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

      // Delete all paper holdings - use dedicated method
      const paperHoldings = await holdingsRepository.getPaperTradingHoldings(userId);
      const paperHoldingIds = paperHoldings.map(h => h.id);

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

      // Calculate rankings and add portfolio values - use dedicated method
      const rankings = await Promise.all(leaderboardData.map(async (entry, index) => {
        const paperHoldings = await holdingsRepository.getPaperTradingHoldings(entry.userId);
        
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
      console.log(`[PaperTradingService] Getting performance history for user ${userId}, period: ${period}`);
      
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

      // Try to get performance history from repository
      let history = [];
      try {
        history = await paperAccountRepository.getPerformanceHistory(userId, days);
        console.log(`[PaperTradingService] Found ${history.length} portfolio snapshots`);
        
        // If we have history, format it properly
        if (history && history.length > 0) {
          const formattedHistory = history.map(snapshot => ({
            timestamp: new Date(snapshot.date).getTime(),
            date: snapshot.date,
            total_value: parseFloat(snapshot.value),
            current_balance: 0, // Not available in snapshots
            holdings_value: 0   // Not available in snapshots
          }));
          
          console.log(`[PaperTradingService] Returning ${formattedHistory.length} formatted snapshots`);
          return formattedHistory;
        }
      } catch (repoError) {
        console.log('[PaperTradingService] Portfolio snapshots not available:', repoError.message);
      }

      // If no history available, generate synthetic data based on current account state
      console.log('[PaperTradingService] Generating synthetic performance history...');
      
      const account = await this.getAccountSummary(userId);
      const currentValue = account.totalValue;
      const initialValue = account.initialBalance;
      
      // Generate data points for the requested period
      const dataPoints = Math.min(days, 30); // Max 30 points for performance
      const now = new Date();
      const msPerDay = 24 * 60 * 60 * 1000;
      
      const syntheticHistory = [];
      
      for (let i = dataPoints - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * msPerDay));
        
        // Create a simple progression from initial to current value
        // This simulates gradual portfolio growth/decline
        const progress = (dataPoints - 1 - i) / (dataPoints - 1);
        const value = initialValue + (currentValue - initialValue) * progress;
        
        syntheticHistory.push({
          timestamp: date.getTime(),
          date: date.toISOString().split('T')[0],
          total_value: Math.max(0, value), // Ensure non-negative
          current_balance: account.currentBalance * (1 - progress * 0.5), // Simulate balance changes
          holdings_value: Math.max(0, value - account.currentBalance * (1 - progress * 0.5))
        });
      }
      
      console.log(`[PaperTradingService] Generated ${syntheticHistory.length} synthetic data points`);
      console.log(`[PaperTradingService] Value range: ${syntheticHistory[0].total_value.toFixed(2)} -> ${syntheticHistory[syntheticHistory.length - 1].total_value.toFixed(2)}`);
      
      return syntheticHistory;
    } catch (error) {
      console.error('[PaperTradingService] Error getting performance history:', error);
      
      // Return minimal fallback data
      const now = new Date();
      return [{
        timestamp: now.getTime(),
        date: now.toISOString().split('T')[0],
        total_value: 100000,
        current_balance: 100000,
        holdings_value: 0
      }];
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
