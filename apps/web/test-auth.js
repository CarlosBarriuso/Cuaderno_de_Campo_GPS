#!/usr/bin/env node

// Test script para verificar la autenticación step by step

const API_BASE_URL = 'http://localhost:3004';

async function testAPIEndpoints() {
  console.log('🔍 Testing API authentication flow...\n');

  // 1. Test health endpoint (público)
  console.log('1. Testing health endpoint (público)...');
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData);
  } catch (error) {
    console.log('❌ Health error:', error.message);
  }

  // 2. Test auth status sin token
  console.log('\n2. Testing auth status sin token...');
  try {
    const statusResponse = await fetch(`${API_BASE_URL}/api/auth/status`);
    const statusData = await statusResponse.json();
    console.log('✅ Auth status (no token):', statusData);
  } catch (error) {
    console.log('❌ Auth status error:', error.message);
  }

  // 3. Test auth status con test-token
  console.log('\n3. Testing auth status con test-token...');
  try {
    const statusResponse = await fetch(`${API_BASE_URL}/api/auth/status`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    const statusData = await statusResponse.json();
    console.log('✅ Auth status (con token):', statusData);
  } catch (error) {
    console.log('❌ Auth status error:', error.message);
  }

  // 4. Test parcelas endpoint (protegido) sin token
  console.log('\n4. Testing parcelas endpoint sin token...');
  try {
    const parcelasResponse = await fetch(`${API_BASE_URL}/api/parcelas`);
    if (parcelasResponse.status === 401) {
      console.log('✅ Parcelas sin token: 401 (expected)');
    } else {
      const parcelasData = await parcelasResponse.json();
      console.log('⚠️ Parcelas sin token (unexpected):', parcelasData);
    }
  } catch (error) {
    console.log('❌ Parcelas error:', error.message);
  }

  // 5. Test parcelas endpoint (protegido) con token
  console.log('\n5. Testing parcelas endpoint con test-token...');
  try {
    const parcelasResponse = await fetch(`${API_BASE_URL}/api/parcelas`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    const parcelasData = await parcelasResponse.json();
    console.log('✅ Parcelas con token:', parcelasData);
  } catch (error) {
    console.log('❌ Parcelas error:', error.message);
  }

  console.log('\n🎯 API authentication test completed!');
}

// Run the test
testAPIEndpoints().catch(console.error);