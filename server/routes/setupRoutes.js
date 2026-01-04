import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// One-time setup endpoint - should be disabled after first use
// Cleanup endpoint to drop tables with schema issues
router.post('/cleanup-database', async (req, res) => {
  try {
    console.log('Starting database cleanup...');
    
    // Drop tables in reverse dependency order
    const dropQueries = [
      'DROP TABLE IF EXISTS watchlist CASCADE;',
      'DROP TABLE IF EXISTS price_alerts CASCADE;',
      'DROP TABLE IF EXISTS notifications CASCADE;',
      'DROP TABLE IF EXISTS schema_migrations CASCADE;'
    ];

    for (const query of dropQueries) {
      console.log(`Executing: ${query}`);
      await db.query(query);
    }

    console.log('Database cleanup completed successfully');
    res.json({ 
      success: true, 
      message: 'Database cleanup completed. You can now run initialize-database again.' 
    });
  } catch (error) {
    console.error('Database cleanup error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/initialize-database', async (req, res) => {
  const client = await db.connect();
  
  try {
    console.log('🔧 Starting database initialization...');
    
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);
    
    let executed = 0;
    let skipped = 0;

    for (const file of migrationFiles) {
      // Check if migration has already been run
      const result = await client.query(
        'SELECT migration_name FROM schema_migrations WHERE migration_name = $1',
        [file]
      );
      
      if (result.rows.length > 0) {
        console.log(`⊘ Skipping (already run): ${file}`);
        skipped++;
        continue;
      }
      
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Run migration in a transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✅ Completed: ${file}`);
        executed++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    }

    console.log(`✅ Database initialization complete! Executed: ${executed}, Skipped: ${skipped}`);
    
    res.json({
      success: true,
      message: 'Database initialized successfully',
      migrationsExecuted: executed,
      migrationsSkipped: skipped,
      totalMigrations: migrationFiles.length
    });
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    client.release();
  }
});

// Health check for database
router.get('/database-status', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      success: true,
      message: 'Database connection successful',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API configuration diagnostic endpoint
router.get('/api-config-status', (req, res) => {
  const coingeckoKey = process.env.COINGECKO_API_KEY;
  // Pro API is only used if explicitly enabled via COINGECKO_USE_PRO_API=true
  const isProKey = process.env.COINGECKO_USE_PRO_API === 'true';
  
  res.json({
    success: true,
    config: {
      coingecko: {
        hasApiKey: !!coingeckoKey,
        keyType: coingeckoKey ? (isProKey ? 'Pro' : 'Demo') : 'None',
        keyPrefix: coingeckoKey ? coingeckoKey.substring(0, 5) + '...' : 'N/A',
        baseUrl: isProKey ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3'
      },
      environment: process.env.NODE_ENV,
      frontendUrl: process.env.FRONTEND_URL
    }
  });
});

// Test CoinGecko API directly
router.get('/test-coingecko', async (req, res) => {
  const axios = (await import('axios')).default;
  const coingeckoKey = process.env.COINGECKO_API_KEY;
  // Pro API is only used if explicitly enabled via COINGECKO_USE_PRO_API=true
  const isProKey = process.env.COINGECKO_USE_PRO_API === 'true';
  const baseUrl = isProKey ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3';
  
  try {
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'TradeX-Platform/1.0'
    };
    
    if (coingeckoKey) {
      if (isProKey) {
        headers['x-cg-pro-api-key'] = coingeckoKey;
      } else {
        headers['x-cg-demo-api-key'] = coingeckoKey;
      }
    }
    
    console.log('[TestCoinGecko] Testing API with headers:', Object.keys(headers));
    console.log('[TestCoinGecko] Base URL:', baseUrl);
    console.log('[TestCoinGecko] Key type:', isProKey ? 'Pro' : 'Demo');
    
    const response = await axios.get(`${baseUrl}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 5,
        page: 1,
        sparkline: false
      },
      headers,
      timeout: 10000
    });
    
    res.json({
      success: true,
      message: 'CoinGecko API working!',
      keyType: isProKey ? 'Pro' : 'Demo',
      baseUrl: baseUrl,
      dataCount: response.data.length,
      sampleData: response.data.slice(0, 2).map(c => ({
        id: c.id,
        symbol: c.symbol,
        name: c.name,
        price: c.current_price
      }))
    });
  } catch (error) {
    console.error('[TestCoinGecko] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      keyType: isProKey ? 'Pro' : 'Demo',
      baseUrl: baseUrl
    });
  }
});

export default router;
