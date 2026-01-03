/**
 * Run Holdings Constraint Fix Migration
 * This script runs the migration to fix the unique constraint on holdings table
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const { Pool } = pg;

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tradex',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting holdings constraint fix migration...\n');

    // Check if the old index exists
    const checkOldIndex = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'holdings' 
      AND indexname = 'idx_holdings_user_symbol_type'
    `);

    // Check if the new index exists
    const checkNewIndex = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'holdings' 
      AND indexname = 'idx_holdings_user_symbol_type_account'
    `);

    console.log('Current state:');
    console.log('- Old index (idx_holdings_user_symbol_type):', checkOldIndex.rows.length > 0 ? 'EXISTS' : 'NOT FOUND');
    console.log('- New index (idx_holdings_user_symbol_type_account):', checkNewIndex.rows.length > 0 ? 'EXISTS' : 'NOT FOUND');
    console.log('');

    if (checkNewIndex.rows.length > 0) {
      console.log('✅ Migration already applied! The new unique constraint is in place.');
      console.log('   Holdings can now have the same symbol in different accounts (paper vs default).\n');
      return;
    }

    // Read and execute migration
    const migrationPath = join(__dirname, 'migrations', '027_fix_holdings_unique_constraint.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executing migration...\n');
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('Changes applied:');
    console.log('- Dropped old unique index: idx_holdings_user_symbol_type');
    console.log('- Created new unique index: idx_holdings_user_symbol_type_account');
    console.log('- Holdings can now have same symbol in different accounts\n');

    // Verify the changes
    const verifyIndex = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'holdings' 
      AND indexname = 'idx_holdings_user_symbol_type_account'
    `);

    if (verifyIndex.rows.length > 0) {
      console.log('✅ Verification successful!');
      console.log('   Index definition:', verifyIndex.rows[0].indexdef);
    }

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('\n🎉 Holdings constraint fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
