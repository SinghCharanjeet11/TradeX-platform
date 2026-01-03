/**
 * Run AI Insights Migrations
 * Executes migrations for AI predictions, sentiment, signals, and alerts
 */

import { query } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrations = [
  '022_create_ai_predictions_table.sql',
  '023_create_ai_sentiment_table.sql',
  '024_create_ai_signals_table.sql',
  '025_create_ai_alerts_table.sql'
];

async function runMigrations() {
  console.log('🚀 Starting AI Insights migrations...\n');

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

  console.log('🎉 All AI Insights migrations completed successfully!');
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('\n✨ Database is ready for AI Insights');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
