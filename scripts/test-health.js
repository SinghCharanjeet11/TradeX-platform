import axios from 'axios';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const BASE_URL = 'http://localhost:5000';

console.log('\n🔍 TradeX System Health Check\n');
console.log('='.repeat(50));

// Test 1: Environment Variables
console.log('\n1️⃣  Checking Environment Variables...');
const required = ['PORT', 'DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET', 'ENCRYPTION_KEY'];
const missing = required.filter(key => !process.env[key]);
if (missing.length === 0) {
  console.log('✅ All required environment variables are set');
} else {
  console.log(`❌ Missing: ${missing.join(', ')}`);
}

// Test 2: Database Connection
console.log('\n2️⃣  Testing Database Connection...');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

try {
  const client = await pool.connect();
  await client.query('SELECT NOW()');
  console.log('✅ Database connection successful');
  
  // Check tables
  const result = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  
  console.log(`✅ Found ${result.rows.length} database tables:`);
  result.rows.forEach(row => console.log(`   - ${row.table_name}`));
  
  client.release();
} catch (error) {
  console.log(`❌ Database error: ${error.message}`);
}

await pool.end();

// Test 3: Server Health
console.log('\n3️⃣  Testing Server...');
try {
  const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
  if (response.data.status === 'ok') {
    console.log('✅ Server is running and responding');
  }
} catch (error) {
  console.log(`❌ Server not responding: ${error.message}`);
  console.log('   Make sure to start the server with: npm run dev');
}

// Test 4: API Endpoints
console.log('\n4️⃣  Testing API Endpoints...');
const endpoints = [
  '/api/markets/crypto',
  '/api/news',
];

for (const endpoint of endpoints) {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, { 
      timeout: 10000,
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      console.log(`✅ ${endpoint} - OK`);
    } else if (response.status === 401) {
      console.log(`⚠️  ${endpoint} - Requires authentication`);
    } else {
      console.log(`⚠️  ${endpoint} - Status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ ${endpoint} - ${error.message}`);
  }
}

console.log('\n' + '='.repeat(50));
console.log('\n✨ Health check complete!\n');
