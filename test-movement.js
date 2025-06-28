// test-movement.js - Test Movement & Position Tracking Features
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testMovementAPI() {
  console.log('🧪 Testing Movement & Position Tracking API...\n');

  try {
    // Test 1: Get movement status
    console.log('1. Testing movement status endpoint...');
    const statusResponse = await axios.get(`${BASE_URL}/movement/status`);
    console.log('✅ Movement status:', JSON.stringify(statusResponse.data, null, 2));
    console.log('');

    // Test 2: Get players data
    console.log('2. Testing players endpoint...');
    const playersResponse = await axios.get(`${BASE_URL}/movement/players`);
    console.log('✅ Players data:', JSON.stringify(playersResponse.data, null, 2));
    console.log('');

    // Test 3: Start Anti-AFK (if not already active)
    console.log('3. Testing Anti-AFK start...');
    if (!statusResponse.data.antiAfkActive) {
      const startResponse = await axios.post(`${BASE_URL}/movement/anti-afk/start`);
      console.log('✅ Anti-AFK start:', JSON.stringify(startResponse.data, null, 2));
    } else {
      console.log('ℹ️ Anti-AFK already active');
    }
    console.log('');

    // Test 4: Manual movement
    console.log('4. Testing manual movement...');
    const manualMoveResponse = await axios.post(`${BASE_URL}/movement/manual-move`, {
      x: 1.0,
      y: 64.0,
      z: 1.0
    });
    console.log('✅ Manual movement:', JSON.stringify(manualMoveResponse.data, null, 2));
    console.log('');

    // Test 5: Get updated status after movement
    console.log('5. Getting updated status...');
    const updatedStatusResponse = await axios.get(`${BASE_URL}/movement/status`);
    console.log('✅ Updated status:', JSON.stringify(updatedStatusResponse.data, null, 2));
    console.log('');

    console.log('🎉 All movement API tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

async function testBasicAPI() {
  console.log('🧪 Testing basic API endpoints...\n');

  try {
    // Test basic endpoints
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);

    const statsResponse = await axios.get(`${BASE_URL}/stats`);
    console.log('✅ Stats available:', Object.keys(statsResponse.data));
    console.log('');

    return true;
  } catch (error) {
    console.error('❌ Basic API test failed:', error.message);
    return false;
  }
}

async function waitForServer() {
  console.log('⏳ Waiting for server to be ready...');
  
  for (let i = 0; i < 30; i++) {
    try {
      await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is ready!');
      return true;
    } catch (error) {
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n❌ Server not ready after 30 seconds');
  return false;
}

async function main() {
  console.log('🚀 Starting Movement & Position Tracking Tests\n');

  // Wait for server
  const serverReady = await waitForServer();
  if (!serverReady) {
    process.exit(1);
  }

  // Test basic API first
  const basicOK = await testBasicAPI();
  if (!basicOK) {
    console.log('❌ Basic API tests failed, skipping movement tests');
    process.exit(1);
  }

  // Test movement API
  await testMovementAPI();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testMovementAPI, testBasicAPI, waitForServer };
