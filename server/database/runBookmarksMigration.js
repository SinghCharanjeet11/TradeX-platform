/**
 * Run Bookmarks Table Migration
 * Creates the bookmarks table for news article bookmarking
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
  database: process.env.DB_NAME || 'tradex',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
})

async function runMigration() {
  const client = await pool.connect()
  
  try {
    console.log('Starting bookmarks table migration...')
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '013_create_bookmarks_table.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Execute migration
    await client.query('BEGIN')
    await client.query(migrationSQL)
    await client.query('COMMIT')
    
    console.log('✓ Bookmarks table created successfully')
    
    // Verify table exists
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'bookmarks'
    `)
    
    if (result.rows.length > 0) {
      console.log('✓ Bookmarks table verified')
    } else {
      throw new Error('Bookmarks table not found after migration')
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
