/**
 * Test Binance API Signature
 * Helps diagnose signature validation issues
 */

import crypto from 'crypto'

console.log('🔍 Binance API Signature Diagnostic Tool\n')

// Test credentials (replace with your actual credentials to test)
const API_KEY = 'rqh3m2qhdqtlMrsQ4rQlqf0bDPpx15Z4Xai1116SSX4c1pGK3PXnnsulebIxtBAI'
const API_SECRET = 'your_secret_here' // Replace with actual secret

console.log('API Key:', API_KEY)
console.log('API Key length:', API_KEY.length)
console.log('API Key has whitespace:', /\s/.test(API_KEY))
console.log('API Secret length:', API_SECRET.length)
console.log('API Secret has whitespace:', /\s/.test(API_SECRET))

// Test signature generation
const timestamp = Date.now()
const queryString = `timestamp=${timestamp}`

console.log('\n📝 Signature Generation Test:')
console.log('Timestamp:', timestamp)
console.log('Query string:', queryString)

const signature = crypto
  .createHmac('sha256', API_SECRET)
  .update(queryString)
  .digest('hex')

console.log('Generated signature:', signature)

// Test with binance-api-node
console.log('\n🧪 Testing with binance-api-node library...')

try {
  const binanceModule = await import('binance-api-node')
  const Binance = binanceModule.default
  
  console.log('Binance function type:', typeof Binance)
  
  const client = Binance({
    apiKey: API_KEY.trim(),
    apiSecret: API_SECRET.trim()
  })
  
  console.log('✅ Client created successfully')
  console.log('Client type:', typeof client)
  
  // Try to call accountInfo
  console.log('\n📞 Calling accountInfo()...')
  const accountInfo = await client.accountInfo()
  
  console.log('✅ SUCCESS! Account info retrieved')
  console.log('Account type:', accountInfo.accountType)
  console.log('Can trade:', accountInfo.canTrade)
  console.log('Can withdraw:', accountInfo.canWithdraw)
  console.log('Balances count:', accountInfo.balances.length)
  
} catch (error) {
  console.error('\n❌ ERROR:', error.message)
  console.error('Error code:', error.code)
  console.error('Error URL:', error.url)
  
  if (error.code === -1022) {
    console.log('\n💡 Error -1022 means: Signature for this request is not valid')
    console.log('Common causes:')
    console.log('  1. API Secret is incorrect or doesn\'t match the API Key')
    console.log('  2. Extra whitespace in credentials')
    console.log('  3. API Key has been deleted or regenerated on Binance')
    console.log('  4. System time is significantly out of sync')
    console.log('\n🔧 Solutions:')
    console.log('  1. Double-check you copied BOTH the key AND secret correctly')
    console.log('  2. Make sure you saved the secret when creating the API key')
    console.log('  3. Create a completely new API key on Binance')
    console.log('  4. Check your system time is correct')
  }
}

console.log('\n---')
console.log('💡 To test with your real credentials:')
console.log('   Edit this file and replace API_KEY and API_SECRET with your actual values')
console.log('   Then run: node test-binance-signature.js')
