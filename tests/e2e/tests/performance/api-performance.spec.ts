import { test, expect } from '@playwright/test';

/**
 * API Performance Tests - Phase 4
 * Tests response times and load handling for critical agricultural APIs
 */
test.describe('API Performance Tests', () => {
  const performanceThresholds = {
    fast: 200,    // Critical endpoints should respond within 200ms
    medium: 1000, // Most endpoints should respond within 1s
    slow: 5000,   // Complex operations within 5s
    timeout: 30000 // Maximum timeout for any operation
  };

  test('Core API Performance - Critical Endpoints', async ({ request }) => {
    await test.step('Test health check endpoint speed', async () => {
      const start = Date.now();
      const response = await request.get('/health');
      const responseTime = Date.now() - start;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(performanceThresholds.fast);
      
      console.log(`Health check response time: ${responseTime}ms`);
    });

    await test.step('Test parcelas list endpoint speed', async () => {
      const start = Date.now();
      const response = await request.get('/api/parcelas');
      const responseTime = Date.now() - start;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(performanceThresholds.medium);
      
      console.log(`Parcelas list response time: ${responseTime}ms`);
    });

    await test.step('Test actividades list endpoint speed', async () => {
      const start = Date.now();
      const response = await request.get('/api/actividades');
      const responseTime = Date.now() - start;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(performanceThresholds.medium);
      
      console.log(`Actividades list response time: ${responseTime}ms`);
    });
  });

  test('Weather API Performance', async ({ request }) => {
    const testCoords = { lat: 40.4168, lng: -3.7038 }; // Madrid

    await test.step('Test current weather performance', async () => {
      const start = Date.now();
      const response = await request.get(
        `/api/weather/current?lat=${testCoords.lat}&lng=${testCoords.lng}`
      );
      const responseTime = Date.now() - start;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(performanceThresholds.slow);
      
      console.log(`Weather current response time: ${responseTime}ms`);
    });

    await test.step('Test cached weather performance', async () => {
      // First request (cache miss)
      const start1 = Date.now();
      await request.get(`/api/weather/current?lat=${testCoords.lat}&lng=${testCoords.lng}`);
      const time1 = Date.now() - start1;
      
      // Second request (cache hit)
      const start2 = Date.now();
      const response2 = await request.get(`/api/weather/current?lat=${testCoords.lat}&lng=${testCoords.lng}`);
      const time2 = Date.now() - start2;
      
      expect(response2.status()).toBe(200);
      expect(time2).toBeLessThan(performanceThresholds.fast);
      expect(time2).toBeLessThan(time1 / 2); // Cache should be at least 50% faster
      
      console.log(`Cached weather response time: ${time2}ms (vs ${time1}ms uncached)`);
    });
  });

  test('SIGPAC API Performance', async ({ request }) => {
    const testReference = '28:079:0001:00001:0001:WX'; // Madrid reference

    await test.step('Test SIGPAC validation performance', async () => {
      const start = Date.now();
      const response = await request.post('/api/sigpac/validate', {
        data: { reference: testReference }
      });
      const responseTime = Date.now() - start;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(performanceThresholds.slow);
      
      console.log(`SIGPAC validation response time: ${responseTime}ms`);
    });

    await test.step('Test cached SIGPAC performance', async () => {
      // First request (cache miss)
      const start1 = Date.now();
      await request.get(`/api/sigpac/parcel/${testReference}`);
      const time1 = Date.now() - start1;
      
      // Second request (cache hit)
      const start2 = Date.now();
      const response2 = await request.get(`/api/sigpac/parcel/${testReference}`);
      const time2 = Date.now() - start2;
      
      expect(response2.status()).toBe(200);
      expect(time2).toBeLessThan(performanceThresholds.medium);
      expect(time2).toBeLessThan(time1 / 2); // Cache should be at least 50% faster
      
      console.log(`Cached SIGPAC response time: ${time2}ms (vs ${time1}ms uncached)`);
    });
  });

  test('Concurrent Load Testing', async ({ request }) => {
    await test.step('Test concurrent weather requests', async () => {
      const concurrentRequests = 10;
      const requests = [];
      
      const startTime = Date.now();
      
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request.get('/api/weather/current?lat=40.4168&lng=-3.7038')
        );
      }
      
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
      
      // Average response time should be reasonable
      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(performanceThresholds.slow);
      
      console.log(`${concurrentRequests} concurrent weather requests completed in ${totalTime}ms (avg: ${avgResponseTime}ms)`);
    });
  });
});