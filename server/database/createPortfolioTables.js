import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createTables() {
  const client = await pool.connect();
  
  try {
    console.log('Creating portfolio tables...');
    
    // Read and execute each migration
    const migrations = [
      '004_create_portfolio_snapshots_table.sql',
      '005_create_price_history_table.sql',
      '006_enhance_holdings_table.sql'
    ];
    
    for (const migration of migrations) {
      const sqlPath = path.join(__dirname, 'migrations', migration);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      console.log(`Executing: ${migration}`);
      await client.query(sql);
      console.log(`✅ ${migration} completed`);
    }
    
    console.log('\n✅ All portfolio tables created successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createTables();
