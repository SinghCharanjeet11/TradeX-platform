/**
 * Run Portfolio Enhancements Migrations
 * Executes migrations for portfolio_snapshots, price_history, and holdings enhancements
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { query } from '../config/database.js';
import fs from 'fs';

const migrations = [
  '004_create_portfolio_snapshots_table.sql',
  '005_create_price_history_table.sql',
  '006_enhance_holdings_table.sql'
];

async function runMigrations() {
  console.log('🚀 Starting Portfolio Enhancements migrations...\n');

  for (const migration of migrations) {
    try {
      console.log(`📝 Running migration: ${migration}`);
      
      const migrationPath = path.join(__dirname, 'migrations', migration);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      await query(sql);
      
      console.log(`✅ Successfully executed: ${migration}\n`);
    } catch (error) {
      console.error(`❌ Error running migration ${migration}:`, error.message);
      throw error;
    }
  }

  console.log('🎉 All Portfolio Enhancements migrations completed successfully!');
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('\n✨ Database is ready for Portfolio Enhancements');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
