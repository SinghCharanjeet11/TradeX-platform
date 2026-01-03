/**
 * Run Price Alerts Migration
 * Adds initial_price column to price_alerts table
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('Starting price alerts migration...');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '027_add_initial_price_to_alerts.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await query(migrationSQL);

    console.log('✓ Price alerts migration completed successfully');
    console.log('✓ Added initial_price column to price_alerts table');

    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
