/**
 * Run Security Enhancements Migrations
 * Creates all security-related tables: user_2fa, backup_codes, enhanced sessions,
 * rate_limits, ip_blocks, audit_logs, and security_alerts
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

const migrations = [
  '014_create_user_2fa_table.sql',
  '015_create_backup_codes_table.sql',
  '017_enhance_sessions_table.sql',
  '018_create_rate_limits_table.sql',
  '019_create_ip_blocks_table.sql',
  '020_create_audit_logs_table.sql',
  '021_create_security_alerts_table.sql'
]

async function runMigrations() {
  const client = await pool.connect()
  
  try {
    console.log('Starting security enhancements migrations...\n')
    
    for (const migrationFile of migrations) {
      console.log(`Running ${migrationFile}...`)
      
      // Read migration file
      const migrationPath = path.join(__dirname, 'migrations', migrationFile)
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
      
      // Execute migration
      await client.query('BEGIN')
      await client.query(migrationSQL)
      await client.query('COMMIT')
      
      console.log(`✓ ${migrationFile} completed\n`)
    }
    
    // Verify all tables exist
    console.log('Verifying tables...')
    const tables = [
      'user_2fa',
      'backup_codes',
      'rate_limits',
      'ip_blocks',
      'audit_logs',
      'security_alerts'
    ]
    
    for (const tableName of tables) {
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      `, [tableName])
      
      if (result.rows.length > 0) {
        console.log(`✓ ${tableName} table verified`)
      } else {
        throw new Error(`${tableName} table not found after migration`)
      }
    }
    
    // Verify sessions table enhancements
    const sessionColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'sessions'
      AND column_name IN ('device_fingerprint', 'device_type', 'last_activity')
    `)
    
    if (sessionColumns.rows.length === 3) {
      console.log('✓ sessions table enhancements verified')
    } else {
      throw new Error('sessions table enhancements not found')
    }
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('\n✗ Migration failed:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('\n✓ All security migrations completed successfully')
    console.log('\nSecurity features enabled:')
    console.log('  - Two-Factor Authentication (2FA)')
    console.log('  - Enhanced Session Management')
    console.log('  - API Rate Limiting')
    console.log('  - Comprehensive Audit Logging')
    console.log('  - Security Monitoring & Alerts')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n✗ Migrations failed:', error)
    process.exit(1)
  })
