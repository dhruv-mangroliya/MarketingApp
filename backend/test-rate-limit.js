const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

// Test Auth Rate Limiting (5 requests/15min)
async function testAuthRateLimit() {
  console.log('\n🔐 Testing Auth Rate Limiting (5 requests/15min)...\n');
  
  for (let i = 1; i <= 7; i++) {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/google`, {
        token: 'test-token'
      });
      
      console.log(`✅ Request ${i}: Status ${response.status}`);
      console.log(`   Rate Limit: ${response.headers['x-ratelimit-remaining']} remaining`);
      
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(`❌ Request ${i}: RATE LIMITED!`);
        console.log(`   Message: ${error.response.data.error}`);
        console.log(`   Retry After: ${error.response.data.retryAfter}`);
      } else {
        console.log(`⚠️  Request ${i}: Error ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// Test SMS Rate Limiting (3 requests/15min)
async function testSMSRateLimit() {
  console.log('\n📱 Testing SMS Rate Limiting (3 requests/15min)...\n');
  
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await axios.post(`${BASE_URL}/api/sms/send`, {
        phone: '+911234567890'
      });
      
      console.log(`✅ Request ${i}: Status ${response.status}`);
      console.log(`   Rate Limit: ${response.headers['x-ratelimit-remaining']} remaining`);
      
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(`❌ Request ${i}: RATE LIMITED!`);
        console.log(`   Message: ${error.response.data.error}`);
      } else {
        console.log(`⚠️  Request ${i}: Error ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// Test Payment Rate Limiting (3 requests/5min)
async function testPaymentRateLimit() {
  console.log('\n💳 Testing Payment Rate Limiting (3 requests/5min)...\n');
  
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await axios.post(`${BASE_URL}/api/payment/create-order`, {
        amount: 1000
      });
      
      console.log(`✅ Request ${i}: Status ${response.status}`);
      console.log(`   Rate Limit: ${response.headers['x-ratelimit-remaining']} remaining`);
      
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(`❌ Request ${i}: RATE LIMITED!`);
        console.log(`   Message: ${error.response.data.error}`);
      } else {
        console.log(`⚠️  Request ${i}: Error ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// Test Global Rate Limiting (100 requests/15min)
async function testGlobalRateLimit() {
  console.log('\n🌐 Testing Global Rate Limiting (100 requests/15min)...\n');
  console.log('Making 5 requests to products endpoint...');
  
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await axios.get(`${BASE_URL}/api/products`);
      
      console.log(`✅ Request ${i}: Status ${response.status}, Products: ${response.data.length}`);
      console.log(`   Rate Limit: ${response.headers['x-ratelimit-remaining']} remaining`);
      
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(`❌ Request ${i}: RATE LIMITED!`);
      } else {
        console.log(`⚠️  Request ${i}: Error ${error.response?.status}`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Rate Limit Tests...');
  console.log('Make sure your server is running on http://localhost:5001\n');
  
  try {
    await testGlobalRateLimit();
    await testAuthRateLimit();
    await testSMSRateLimit();
    await testPaymentRateLimit();
    
    console.log('\n✨ All tests completed!');
    console.log('\n📊 Expected Results:');
    console.log('- Global: All 5 requests should succeed');
    console.log('- Auth: First 5 should succeed, 6th and 7th should be rate limited');
    console.log('- SMS: First 3 should succeed, 4th and 5th should be rate limited');
    console.log('- Payment: First 3 should succeed, 4th and 5th should be rate limited');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testAuthRateLimit,
  testSMSRateLimit,
  testPaymentRateLimit,
  testGlobalRateLimit,
  runAllTests
};