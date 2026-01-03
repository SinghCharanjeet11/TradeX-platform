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
  try {
    console.log('🔧 Starting database initialization...');
    
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      await db.query(sql);
      console.log(`✅ Completed: ${file}`);
    }

    console.log('✅ Database initialization complete!');
    
    res.json({
      success: true,
      message: 'Database initialized successfully',
      migrationsRun: migrationFiles.length
    });
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
