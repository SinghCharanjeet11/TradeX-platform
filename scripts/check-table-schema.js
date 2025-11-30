/**
 * Check connected_accounts table schema
 */
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: './server/.env' })

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
})

async function checkSchema() {
  try {
    console.log('Checking connected_accounts table schema...\n')
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'connected_accounts'
      );
    `)
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table does not exist')
      await pool.end()
      return
    }
    
    console.log('✓ Table exists\n')
    
    // Get column information
    const columns = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'connected_accounts'
      ORDER BY ordinal_position;
    `)
    
    console.log('Table Schema:')
    console.log('─'.repeat(80))
    columns.rows.forEach(col => {
      console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(20)} | Nullable: ${col.is_nullable}`)
    })
    console.log('─'.repeat(80))
    
    await pool.end()
  } catch (error) {
    console.error('Error:', error.message)
    await pool.end()
  }
}

checkSchema()
