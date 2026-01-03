/**
 * Run OAuth Accounts Table Migration
 * Creates the oauth_accounts table for OAuth authentication
 */

import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const { Pool } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tradex_auth',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
})

async function runMigration() {
  const client = await pool.connect()
  
  try {
    console.log('Starting OAuth accounts table migration...')
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '026_create_oauth_accounts_table.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Execute migration
    await client.query('BEGIN')
    await client.query(migrationSQL)
    await client.query('COMMIT')
    
    console.log('✓ OAuth accounts table created successfully')
    
    // Verify table exists
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'oauth_accounts'
    `)
    
    if (result.rows.length > 0) {
      console.log('✓ OAuth accounts table verified')
    } else {
      throw new Error('OAuth accounts table not found after migration')
    }
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('✗ Migration failed:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✓ Migration completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n✗ Migration failed:', error)
    process.exit(1)
  })

