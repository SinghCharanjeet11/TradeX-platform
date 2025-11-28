/**
 * Run Connected Accounts Table Migration
 */
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
import dotenv from 'dotenv'
import { resolve } from 'path'

const envPath = resolve(__dirname, '..', '.env')
dotenv.config({ path: envPath })

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'tradex_auth',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || '')
})

async function runMigration() {
  try {
    console.log('Running connected_accounts table migration...')
    
    const sqlPath = path.join(__dirname, 'migrations', '012_create_connected_accounts_table.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    await pool.query(sql)
    
    console.log('✓ Connected accounts table created successfully')
    
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('✗ Migration failed:', error)
    await pool.end()
    process.exit(1)
  }
}

runMigration()
