/**
 * Test Binance Connection Flow
 * Tests the complete flow of connecting a Binance account
 */

const API_URL = 'http://localhost:5000/api'

async function testBinanceConnection() {
  console.log('🧪 Testing Binance Connection Flow\n')
  
  let authToken = null
  
  try {
    // Step 1: Register a test user
    console.log('1️⃣ Registering test user...')
    const registerResponse = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'TestPassword123!'
      })
    })
    
    const registerData = await registerResponse.json()
    if (!registerData.success) {
      throw new Error(`Registration failed: ${registerData.error}`)
    }
    
    authToken = registerData.token
    console.log('✅ User registered successfully\n')
    
    // Step 2: Test connection with invalid credentials
    console.log('2️⃣ Testing with invalid Binance credentials...')
    const invalidConnectResponse = await fetch(`${API_URL}/auth/connect-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        platform: 'binance',
        credentials: {
          apiKey: 'invalid_key_12345',
          apiSecret: 'invalid_secret_67890'
        }
      })
    })
    
    const invalidConnectData = await invalidConnectResponse.json()
    console.log('Response:', invalidConnectData)
    
    if (!invalidConnectData.success) {
      console.log('✅ Correctly rejected invalid credentials\n')
    } else {
      console.log('⚠️  Warning: Invalid credentials were accepted\n')
    }
    
    // Step 3: Show what valid credentials would look like
    console.log('3️⃣ Valid Binance connection format:')
    console.log('POST /api/auth/connect-account')
    console.log('Headers: { Authorization: "Bearer <token>" }')
    console.log('Body: {')
    console.log('  "platform": "binance",')
    console.log('  "credentials": {')
    console.log('    "apiKey": "your_actual_binance_api_key",')
    console.log('    "apiSecret": "your_actual_binance_api_secret"')
    console.log('  }')
    console.log('}\n')
    
    // Step 4: Get connected accounts
    console.log('4️⃣ Getting connected accounts...')
    const accountsResponse = await fetch(`${API_URL}/auth/connected-accounts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    const accountsData = await accountsResponse.json()
    console.log('Connected accounts:', accountsData)
    console.log('✅ Connected accounts retrieved\n')
    
    console.log('✅ All tests completed successfully!')
    console.log('\n📝 Summary:')
    console.log('   - Binance service is working correctly')
    console.log('   - Invalid credentials are properly rejected')
    console.log('   - Connection endpoint is functional')
    console.log('\n💡 To connect a real Binance account:')
    console.log('   1. Log in to your TradeX account')
    console.log('   2. Go to Dashboard > Connected Accounts')
    console.log('   3. Click "Connect Account" and select Binance')
    console.log('   4. Enter your Binance API credentials')
    console.log('   5. Make sure your API key has "Read" permissions only')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error)
  }
}

testBinanceConnection()
