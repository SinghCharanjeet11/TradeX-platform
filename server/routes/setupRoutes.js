import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// One-time setup endpoint - should be disabled after first use
router.post('/initialize-database', async (req, res) => {
  const client = await db.connect();
  
  try {
    console.log('🔧 Starting database initialization...');
    
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);
    
    let executed = 0;
    let skipped = 0;

    for (const file of migrationFiles) {
      // Check if migration has already been run
      const result = await client.query(
        'SELECT migration_name FROM schema_migrations WHERE migration_name = $1',
        [file]
      );
      
      if (result.rows.length > 0) {
        console.log(`⊘ Skipping (already run): ${file}`);
        skipped++;
        continue;
      }
      
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Run migration in a transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✅ Completed: ${file}`);
        executed++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    }

    console.log(`✅ Database initialization complete! Executed: ${executed}, Skipped: ${skipped}`);
    
    res.json({
      success: true,
      message: 'Database initialized successfully',
      migrationsExecuted: executed,
      migrationsSkipped: skipped,
      totalMigrations: migrationFiles.length
    });
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    client.release();
  }
});

// Health check for database
router.get('/database-status', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      success: true,
      message: 'Database connection successful',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
