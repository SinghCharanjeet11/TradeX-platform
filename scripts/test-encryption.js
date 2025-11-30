/**
 * Test encryption functionality
 */
import encryption from './server/utils/encryption.js'

console.log('Testing encryption...\n')

try {
  // Test data
  const testData = {
    apiKey: 'test_api_key_12345',
    apiSecret: 'test_api_secret_67890'
  }
  
  console.log('Original data:', testData)
  
  // Encrypt
  console.log('\nEncrypting...')
  const encrypted = encryption.encrypt(testData)
  console.log('Encrypted:', encrypted)
  console.log('Encrypted length:', encrypted.length)
  
  // Decrypt
  console.log('\nDecrypting...')
  const decrypted = encryption.decrypt(encrypted)
  console.log('Decrypted:', decrypted)
  
  // Verify
  console.log('\nVerification:')
  console.log('API Key match:', testData.apiKey === decrypted.apiKey)
  console.log('API Secret match:', testData.apiSecret === decrypted.apiSecret)
  
  if (testData.apiKey === decrypted.apiKey && testData.apiSecret === decrypted.apiSecret) {
    console.log('\n✅ Encryption test PASSED')
  } else {
    console.log('\n❌ Encryption test FAILED')
  }
  
} catch (error) {
  console.error('\n❌ Encryption test FAILED with error:')
  console.error(error)
}
