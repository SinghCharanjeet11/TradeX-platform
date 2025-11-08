import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from '../config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const runMigrations = async () => {
  const client = await pool.connect()
  
  try {
    console.log('Starting database migrations...')
    
    const migrationsDir = path.join(__dirname, 'migrations')
    const files = fs.readdirSync(migrationsDir).sort()
    
    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`Running migration: ${file}`)
        const filePath = path.join(migrationsDir, file)
        const sql = fs.readFileSync(filePath, 'utf8')
        
        await client.query(sql)
        console.log(`✓ Completed: ${file}`)
      }
    }
    
    console.log('All migrations completed successfully!')
  } catch (error) {
    console.error('Migration error:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runMigrations()
  .then(() => {
    console.log('Database initialized successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  })
