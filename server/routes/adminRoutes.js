import express from 'express';
import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Admin endpoint to run migrations
router.post('/run-migrations', async (req, res) => {
  try {
    const migrations = [
      '004_create_portfolio_snapshots_table.sql',
      '005_create_price_history_table.sql',
      '006_enhance_holdings_table.sql'
    ];
    
    const results = [];
    
    for (const migration of migrations) {
      const sqlPath = path.join(__dirname, '../database/migrations', migration);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      await pool.query(sql);
      results.push(`✅ ${migration} completed`);
    }
    
    res.json({
      success: true,
      message: 'All migrations completed successfully',
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
