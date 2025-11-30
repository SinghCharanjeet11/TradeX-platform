import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

console.log('\n🔑 Testing API Keys\n');
console.log('='.repeat(50));

// Test Alpha Vantage
async function testAlphaVantage() {
  console.log('\n1️⃣  Testing Alpha Vantage API...');
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  
  if (!apiKey || apiKey === 'your_alpha_vantage_api_key_here') {
    console.log('❌ Alpha Vantage API key not configured');
    console.log('   Get a free key at: https://www.alphavantage.co/support/#api-key');
    return false;
  }
  
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${apiKey}`,
      { timeout: 10000 }
    );
    
    if (response.data['Global Quote']) {
      console.log('✅ Alpha Vantage API key is valid');
      console.log(`   Test quote: AAPL = $${response.data['Global Quote']['05. price']}`);
      return true;
    } else if (response.data.Note) {
      console.log('⚠️  Alpha Vantage API rate limit reached');
      console.log('   Message:', response.data.Note);
      return false;
    } else if (response.data['Error Message']) {
      console.log('❌ Alpha Vantage API error:', response.data['Error Message']);
      return false;
    } else {
      console.log('⚠️  Unexpected response from Alpha Vantage');
      console.log('   Response:', JSON.stringify(response.data).substring(0, 200));
      return false;
    }
  } catch (error) {
    console.log('❌ Alpha Vantage API request failed:', error.message);
    return false;
  }
}

// Test CryptoCompare
async function testCryptoCompare() {
  console.log('\n2️⃣  Testing CryptoCompare API...');
  const apiKey = process.env.CRYPTOCOMPARE_API_KEY;
  
  if (!apiKey || apiKey === 'your_cryptocompare_api_key_here') {
    console.log('❌ CryptoCompare API key not configured');
    console.log('   Get a free key at: https://www.cryptocompare.com/cryptopian/api-keys');
    return false;
  }
  
  try {
    const response = await axios.get(
      `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&api_key=${apiKey}`,
      { timeout: 10000 }
    );
    
    if (response.data.Data && response.data.Data.length > 0) {
      console.log('✅ CryptoCompare API key is valid');
      console.log(`   Found ${response.data.Data.length} news articles`);
      return true;
    } else if (response.data.Message) {
      console.log('❌ CryptoCompare API error:', response.data.Message);
      return false;
    } else {
      console.log('⚠️  Unexpected response from CryptoCompare');
      return false;
    }
  } catch (error) {
    console.log('❌ CryptoCompare API request failed:', error.message);
    return false;
  }
}

// Test CoinGecko (no key required)
async function testCoinGecko() {
  console.log('\n3️⃣  Testing CoinGecko API...');
  
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      { timeout: 10000 }
    );
    
    if (response.data.bitcoin && response.data.bitcoin.usd) {
      console.log('✅ CoinGecko API is working');
      console.log(`   Bitcoin price: $${response.data.bitcoin.usd.toLocaleString()}`);
      return true;
    } else {
      console.log('⚠️  Unexpected response from CoinGecko');
      return false;
    }
  } catch (error) {
    console.log('❌ CoinGecko API request failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = {
    alphaVantage: await testAlphaVantage(),
    cryptoCompare: await testCryptoCompare(),
    coinGecko: await testCoinGecko()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Summary:\n');
  console.log(`Alpha Vantage: ${results.alphaVantage ? '✅ Working' : '❌ Not Working'}`);
  console.log(`CryptoCompare: ${results.cryptoCompare ? '✅ Working' : '❌ Not Working'}`);
  console.log(`CoinGecko:     ${results.coinGecko ? '✅ Working' : '❌ Not Working'}`);
  
  if (!results.alphaVantage || !results.cryptoCompare) {
    console.log('\n⚠️  Action Required:\n');
    
    if (!results.alphaVantage) {
      console.log('1. Get Alpha Vantage API key:');
      console.log('   https://www.alphavantage.co/support/#api-key');
      console.log('   Then update ALPHA_VANTAGE_API_KEY in server/.env\n');
    }
    
    if (!results.cryptoCompare) {
      console.log('2. Get CryptoCompare API key:');
      console.log('   https://www.cryptocompare.com/cryptopian/api-keys');
      console.log('   Then update CRYPTOCOMPARE_API_KEY in server/.env\n');
    }
  } else {
    console.log('\n✨ All API keys are configured correctly!\n');
  }
  
  console.log('='.repeat(50) + '\n');
}

runTests();
