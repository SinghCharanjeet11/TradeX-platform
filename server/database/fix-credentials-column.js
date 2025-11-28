/**
 * Fix credentials column type from JSONB to TEXT
 */
import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load from server/.env
dotenv.config({ path: resolve(__dirname, '..', '.env') })

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
})

async function fixColumn() {
  try {
    console.log('Fixing credentials column type...\n')
    
    // Alter the column type from JSONB to TEXT
    await pool.query(`
      ALTER TABLE connected_accounts 
      ALTER COLUMN credentials TYPE TEXT;
    `)
    
    console.log('✓ Successfully changed credentials column from JSONB to TEXT')
    console.log('✓ Encrypted credentials can now be stored properly\n')
    
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('✗ Error:', error.message)
    await pool.end()
    process.exit(1)
  }
}

fixColumn()
