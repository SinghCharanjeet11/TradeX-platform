import pkg from 'pg'
const { Pool } = pkg
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create a new pool with explicit configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'tradex_auth',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || '')
})

async function runProfileMigration() {
  let client
  try {
    console.log('Running profile fields migration...')
    console.log('Connecting to database:', process.env.DB_NAME)
    
    client = await pool.connect()
    
    const migrationPath = path.join(__dirname, 'migrations', '022_add_user_profile_fields.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    await client.query(sql)
    
    console.log('✅ Profile fields migration completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    if (client) client.release()
    await pool.end()
  }
}

runProfileMigration()
  .then(() => {
    console.log('Migration script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration script failed:', error)
    process.exit(1)
  })
