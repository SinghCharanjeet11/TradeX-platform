/**
 * Run Paper Trading Migrations
 * Executes migrations for paper_accounts and paper_account_resets tables
 */

import { query } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrations = [
  '013_create_paper_accounts_table.sql',
  '014_create_paper_account_resets_table.sql'
];

async function runMigrations() {
  console.log('🚀 Starting Paper Trading migrations...\n');

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

  console.log('🎉 All Paper Trading migrations completed successfully!');
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('\n✨ Database is ready for Paper Trading feature');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
