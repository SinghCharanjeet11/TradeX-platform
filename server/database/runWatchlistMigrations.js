/**
 * Run Watchlist and Price Alerts Migrations
 * Creates watchlist and price_alerts tables
 */

import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const { Pool } = pg

// Load environment variables
dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
})

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runMigrations() {
  const client = await pool.connect()

  try {
    console.log('🚀 Starting watchlist migrations...\n')

    // Read migration files
    const watchlistMigration = readFileSync(
      join(__dirname, 'migrations', '007_create_watchlist_table.sql'),
      'utf8'
    )
    const alertsMigration = readFileSync(
      join(__dirname, 'migrations', '008_create_price_alerts_table.sql'),
      'utf8'
    )

    // Run watchlist migration
    console.log('📋 Creating watchlist table...')
    await client.query(watchlistMigration)
    console.log('✅ Watchlist table created successfully\n')

    // Run price alerts migration
    console.log('📋 Creating price_alerts table...')
    await client.query(alertsMigration)
    console.log('✅ Price alerts table created successfully\n')

    console.log('🎉 All watchlist migrations completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('\n✨ Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error)
    process.exit(1)
  })
