/**
 * Test script to debug the connect-account endpoint
 */
import fetch from 'node-fetch'

const API_URL = 'http://localhost:5000/api/auth'

async function testConnectAccount() {
  try {
    console.log('Testing connect-account endpoint...\n')
    
    // First, login to get a session token
    console.log('1. Logging in...')
    const loginResponse = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!'
      })
    })
    
    const loginData = await loginResponse.json()
    console.log('Login response:', loginData)
    
    if (!loginData.success) {
      console.error('❌ Login failed')
      return
    }
    
    const token = loginData.token
    console.log('✓ Login successful\n')
    
    // Now try to connect Binance account
    console.log('2. Connecting Binance account...')
    const connectResponse = await fetch(`${API_URL}/connect-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session_token=${token}`
      },
      body: JSON.stringify({
        platform: 'binance',
        credentials: {
          apiKey: 'test_api_key',
          apiSecret: 'test_api_secret'
        }
      })
    })
    
    console.log('Response status:', connectResponse.status)
    console.log('Response headers:', connectResponse.headers.raw())
    
    const connectData = await connectResponse.json()
    console.log('Connect response:', JSON.stringify(connectData, null, 2))
    
    if (connectData.success) {
      console.log('\n✓ Account connected successfully')
    } else {
      console.log('\n❌ Failed to connect account')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testConnectAccount()
