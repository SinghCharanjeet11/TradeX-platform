/**
 * Create portfolio_snapshots table
 */

import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') })

const { Pool } = pg

async function createTable() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  })

  try {
    console.log('🔌 Connecting to database...')
    
    // Read the migration file
    const migrationPath = join(__dirname, 'migrations', '004_create_portfolio_snapshots_table.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📝 Creating portfolio_snapshots table...')
    await pool.query(sql)
    
    console.log('✅ Table created successfully!')
    
    // Verify table exists
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'portfolio_snapshots'
    `)
    
    if (result.rows.length > 0) {
      console.log('✅ Verified: portfolio_snapshots table exists')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

createTable()
