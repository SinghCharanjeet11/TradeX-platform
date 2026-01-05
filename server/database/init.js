import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from '../config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const runMigrations = async () => {
  const client = await pool.connect()
  
  try {
    console.log('Starting database migrations...')
    
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    const migrationsDir = path.join(__dirname, 'migrations')
    const files = fs.readdirSync(migrationsDir).sort()
    
    for (const file of files) {
      if (file.endsWith('.sql')) {
        // Check if migration has already been run
        const result = await client.query(
          'SELECT migration_name FROM schema_migrations WHERE migration_name = $1',
          [file]
        )
        
        if (result.rows.length > 0) {
          console.log(`⊘ Skipping (already run): ${file}`)
          continue
        }
        
        console.log(`Running migration: ${file}`)
        const filePath = path.join(migrationsDir, file)
        const sql = fs.readFileSync(filePath, 'utf8')
        
        // Run migration in a transaction
        await client.query('BEGIN')
        try {
          await client.query(sql)
          await client.query(
            'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
            [file]
          )
          await client.query('COMMIT')
          console.log(`✓ Completed: ${file}`)
        } catch (err) {
          await client.query('ROLLBACK')
          throw err
        }
      }
    }
    
    console.log('All migrations completed successfully!')
  } catch (error) {
    console.error('Migration error:', error)
    throw error
  } finally {
    client.release()
  }
}

// Only run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('Database initialized successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Failed to initialize database:', error)
      process.exit(1)
    })
}
