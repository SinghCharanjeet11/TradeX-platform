import axios from 'axios';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const { Pool } = pg;

const BASE_URL = 'http://localhost:5000';
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function logResult(test, status, message) {
  const result = { test, status, message };
  if (status === 'PASS') {
    results.passed.push(result);
    console.log(`✅ ${test}: ${message}`);
  } else if (status === 'FAIL') {
    results.failed.push(result);
    console.log(`❌ ${test}: ${message}`);
  } else {
    results.warnings.push(result);
    console.log(`⚠️  ${test}: ${message}`);
  }
}

async function testDatabaseConnection() {
  try {
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    await pool.end();
    
    logResult('Database Connection', 'PASS', 'Connected successfully');
    return true;
  } catch (error) {
    logResult('Database Connection', 'FAIL', error.message);
    return false;
  }
}

async function testDatabaseTables() {
  try {
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    const client = await pool.connect();
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tables = result.rows.map(row => row.table_name);
    const expectedTables = [
      'users', 'sessions', 'reset_tokens', 'login_attempts',
      'holdings', 'watchlist', 'price_alerts', 'notifications',
      'connected_accounts', 'bookmarks', 'paper_accounts',
      'paper_account_resets', 'portfolio_snapshots', 'price_history'
    ];
    
    const missingTables = expectedTables.filter(t => !tables.includes(t));
    
    client.release();
    await pool.end();
    
    if (missingTables.length === 0) {
      logResult('Database Tables', 'PASS', `All ${tables.length} tables exist`);
      return true;
    } else {
      logResult('Database Tables', 'WARN', `Missing tables: ${missingTables.join(', ')}`);
      return false;
    }
  } catch (error) {
    logResult('Database Tables', 'FAIL', error.message);
    return false;
  }
}

async function testServerHealth() {
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    if (response.data.status === 'ok') {
      logResult('Server Health', 'PASS', 'Server is responding');
      return true;
    } else {
      logResult('Server Health', 'FAIL', 'Unexpected response');
      return false;
    }
  } catch (error) {
    logResult('Server Health', 'FAIL', `Server not responding: ${error.message}`);
    return false;
  }
}

async function testAPIEndpoints() {
  const endpoints = [
    { path: '/api/markets/crypto', name: 'Crypto Markets' },
    { path: '/api/markets/stocks/AAPL', name: 'Stock Quote' },
    { path: '/api/news', name: 'News Feed' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint.path}`, { 
        timeout: 10000,
        validateStatus: (status) => status < 500
      });
      
      if (response.status === 200) {
        logResult(`API: ${endpoint.name}`, 'PASS', 'Endpoint responding');
      } else if (response.status === 401) {
        logResult(`API: ${endpoint.name}`, 'WARN', 'Requires authentication');
      } else {
        logResult(`API: ${endpoint.name}`, 'WARN', `Status: ${response.status}`);
      }
    } catch (error) {
      logResult(`API: ${endpoint.name}`, 'FAIL', error.message);
    }
  }
}

async function testEnvironmentVariables() {
  const required = [
    'PORT', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
    'JWT_SECRET', 'ENCRYPTION_KEY', 'FRONTEND_URL'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length === 0) {
    logResult('Environment Variables', 'PASS', 'All required variables set');
  } else {
    logResult('Environment Variables', 'FAIL', `Missing: ${missing.join(', ')}`);
  }
}

async function runAllTests() {
  console.log('\n🔍 TradeX System Health Check\n');
  console.log('='.repeat(50));
  
  // Test environment
  testEnvironmentVariables();
  
  // Test database
  const dbConnected = await testDatabaseConnection();
  if (dbConnected) {
    await testDatabaseTables();
  }
  
  // Test server
  const serverRunning = await testServerHealth();
  if (serverRunning) {
    await testAPIEndpoints();
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Test Summary:\n');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(r => console.log(`   - ${r.test}: ${r.message}`));
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(r => console.log(`   - ${r.test}: ${r.message}`));
  }
  
  console.log('\n' + '='.repeat(50));
  
  process.exit(results.failed.length > 0 ? 1 : 0);
}

runAllTests();
