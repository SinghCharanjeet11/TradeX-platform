/**
 * TradeX Backend API Test Script
 * Tests all major endpoints automatically
 */

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let userId = '';

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, data = null, useAuth = false) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (useAuth && authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return {
      status: response.status,
      data: result,
      ok: response.ok,
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      ok: false,
    };
  }
}

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}`);
  if (details) console.log(`   ${details}`);
  
  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

// Test functions
async function testRegister() {
  console.log('\n📝 Testing Registration...');
  const response = await makeRequest('POST', '/auth/register', {
    username: 'testuser_' + Date.now(),
    email: `test_${Date.now()}@example.com`,
    password: 'SecurePass123!',
  });

  if (response.ok && response.data.token) {
    authToken = response.data.token;
    userId = response.data.user.id;
    logTest('Register User', true, `Token received: ${authToken.substring(0, 20)}...`);
    return true;
  } else {
    logTest('Register User', false, JSON.stringify(response.data));
    return false;
  }
}

async function testLogin() {
  console.log('\n🔐 Testing Login...');
  const response = await makeRequest('POST', '/auth/login', {
    email: 'test@example.com',
    password: 'SecurePass123!',
  });

  if (response.ok && response.data.token) {
    authToken = response.data.token;
    logTest('Login User', true, 'Token received');
    return true;
  } else {
    logTest('Login User', false, JSON.stringify(response.data));
    return false;
  }
}

async function testGetCurrentUser() {
  console.log('\n👤 Testing Get Current User...');
  const response = await makeRequest('GET', '/auth/me', null, true);

  if (response.ok && response.data.user) {
    logTest('Get Current User', true, `User: ${response.data.user.username}`);
    return true;
  } else {
    logTest('Get Current User', false, JSON.stringify(response.data));
    return false;
  }
}

async function testPortfolioSummary() {
  console.log('\n💼 Testing Portfolio Summary...');
  const response = await makeRequest('GET', '/portfolio/summary', null, true);

  if (response.ok) {
    logTest('Get Portfolio Summary', true, `Total value: $${response.data.totalValue || 0}`);
    return true;
  } else {
    logTest('Get Portfolio Summary', false, JSON.stringify(response.data));
    return false;
  }
}

async function testGetHoldings() {
  console.log('\n📊 Testing Get Holdings...');
  const response = await makeRequest('GET', '/holdings', null, true);

  if (response.ok) {
    logTest('Get Holdings', true, `Holdings count: ${response.data.holdings?.length || 0}`);
    return true;
  } else {
    logTest('Get Holdings', false, JSON.stringify(response.data));
    return false;
  }
}

async function testAddHolding() {
  console.log('\n➕ Testing Add Holding...');
  const response = await makeRequest('POST', '/holdings', {
    symbol: 'BTC',
    name: 'Bitcoin',
    assetType: 'crypto',
    quantity: 0.5,
    avgBuyPrice: 45000,
  }, true);

  if (response.ok || response.status === 201) {
    logTest('Add Holding', true, 'BTC holding added');
    return true;
  } else {
    logTest('Add Holding', false, JSON.stringify(response.data));
    return false;
  }
}

async function testGetCryptoPrices() {
  console.log('\n💰 Testing Crypto Prices...');
  const response = await makeRequest('GET', '/markets/crypto?symbols=BTC,ETH', null, true);

  if (response.ok && response.data.data) {
    logTest('Get Crypto Prices', true, `Prices received: ${response.data.data.length} assets`);
    return true;
  } else {
    logTest('Get Crypto Prices', false, JSON.stringify(response.data));
    return false;
  }
}

async function testGetStockPrices() {
  console.log('\n📈 Testing Stock Prices...');
  const response = await makeRequest('GET', '/markets/stocks?symbols=AAPL,GOOGL', null, true);

  if (response.ok && response.data.data) {
    logTest('Get Stock Prices', true, `Prices received: ${response.data.data.length} stocks`);
    return true;
  } else {
    logTest('Get Stock Prices', false, JSON.stringify(response.data));
    return false;
  }
}

async function testFearGreedIndex() {
  console.log('\n😨 Testing Market Health...');
  const response = await makeRequest('GET', '/markets/health', null, false); // Public endpoint

  if (response.ok) {
    logTest('Get Market Health', true, 'Market health data received');
    return true;
  } else {
    logTest('Get Market Health', false, JSON.stringify(response.data));
    return false;
  }
}

async function testWatchlist() {
  console.log('\n👁️ Testing Watchlist...');
  
  // Add to watchlist
  const addResponse = await makeRequest('POST', '/watchlist', {
    symbol: 'ETH',
    name: 'Ethereum',
    assetType: 'crypto',
  }, true);

  if (addResponse.ok || addResponse.status === 201) {
    logTest('Add to Watchlist', true, 'ETH added');
  } else {
    logTest('Add to Watchlist', false, JSON.stringify(addResponse.data));
  }

  // Get watchlist
  const getResponse = await makeRequest('GET', '/watchlist', null, true);

  if (getResponse.ok) {
    logTest('Get Watchlist', true, `Items: ${getResponse.data.watchlist?.length || 0}`);
    return true;
  } else {
    logTest('Get Watchlist', false, JSON.stringify(getResponse.data));
    return false;
  }
}

async function testOrders() {
  console.log('\n📋 Testing Orders...');
  
  // Create order
  const createResponse = await makeRequest('POST', '/orders', {
    symbol: 'BTC',
    name: 'Bitcoin',
    assetType: 'crypto',
    orderType: 'buy', // Changed from 'type' to 'orderType' and 'market' to 'buy'
    quantity: 0.1,
    price: 45000,
  }, true);

  if (createResponse.ok || createResponse.status === 201) {
    logTest('Create Order', true, 'Order created');
  } else {
    logTest('Create Order', false, JSON.stringify(createResponse.data));
  }

  // Get orders
  const getResponse = await makeRequest('GET', '/orders', null, true);

  if (getResponse.ok) {
    logTest('Get Orders', true, `Orders count: ${getResponse.data.orders?.length || 0}`);
    return true;
  } else {
    logTest('Get Orders', false, JSON.stringify(getResponse.data));
    return false;
  }
}

async function testNews() {
  console.log('\n📰 Testing News...');
  const response = await makeRequest('GET', '/news?category=crypto&limit=5', null, true);

  if (response.ok && response.data.data) {
    logTest('Get News', true, `Articles: ${response.data.data.length}`);
    return true;
  } else {
    logTest('Get News', false, JSON.stringify(response.data));
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting TradeX Backend API Tests...\n');
  console.log('=' .repeat(50));

  try {
    // Authentication tests
    await testRegister();
    // await testLogin(); // Skip if register gives us a token

    if (!authToken) {
      console.log('\n❌ No auth token - cannot continue with protected routes');
      return;
    }

    // Protected route tests
    await testGetCurrentUser();
    await testPortfolioSummary();
    await testGetHoldings();
    await testAddHolding();
    await testGetCryptoPrices();
    await testGetStockPrices();
    await testFearGreedIndex();
    await testWatchlist();
    await testOrders();
    await testNews();

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📝 Total:  ${results.passed + results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));

  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`   - ${t.name}: ${t.details}`));
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();
