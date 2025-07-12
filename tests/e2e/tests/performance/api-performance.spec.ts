import { test, expect } from '@playwright/test';

test.describe('API Performance Tests', () => {
  
  test('Critical API endpoints meet performance requirements', async ({ request }) => {
    
    await test.step('SIGPAC reference lookup <200ms', async () => {
      const start = Date.now();
      const response = await request.get('http://localhost:3002/api/sigpac/parcela/28:079:0001:00001:0001:WX');
      const duration = Date.now() - start;
      
      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(200);
      
      console.log(`SIGPAC lookup: ${duration}ms`);
    });

    await test.step('Current weather data <200ms', async () => {
      const start = Date.now();
      const response = await request.get('http://localhost:3002/api/weather/current?lat=40.4168&lng=-3.7038');
      const duration = Date.now() - start;
      
      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(200);
      
      console.log(`Weather current: ${duration}ms`);
    });

    await test.step('Health checks <100ms', async () => {
      const endpoints = [
        'http://localhost:3002/health',
        'http://localhost:3002/api/sigpac/health',
        'http://localhost:3002/api/weather/health',
        'http://localhost:3002/api/ocr/health'
      ];
      
      for (const endpoint of endpoints) {
        const start = Date.now();
        const response = await request.get(endpoint);
        const duration = Date.now() - start;
        
        expect(response.ok()).toBeTruthy();
        expect(duration).toBeLessThan(100);
        
        console.log(`${endpoint}: ${duration}ms`);
      }
    });

    await test.step('Coordinate search <500ms', async () => {
      const start = Date.now();
      const response = await request.post('http://localhost:3002/api/sigpac/parcelas/search', {
        data: { lat: 40.4168, lng: -3.7038, radius: 1000 }
      });
      const duration = Date.now() - start;
      
      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(500);
      
      console.log(`Coordinate search: ${duration}ms`);
    });
  });

  test('Batch operations performance', async ({ request }) => {
    
    await test.step('SIGPAC batch validation <1000ms', async () => {
      const references = [
        '28:079:0001:00001:0001:WX',
        '41:091:0001:00001:0001:AA',
        '08:019:0001:00001:0001:BB',
        '46:250:0001:00001:0001:CC',
        '14:021:0001:00001:0001:DD'
      ];
      
      const start = Date.now();
      const response = await request.post('http://localhost:3002/api/sigpac/referencias/validate', {
        data: { referencias }
      });
      const duration = Date.now() - start;
      
      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(1000);
      
      console.log(`SIGPAC batch validation (5 refs): ${duration}ms`);
    });

    await test.step('OCR batch processing <2000ms', async () => {
      const images = [
        { nombre: 'test1.jpg', contenido: 'GLIFOSATO 36% SL' },
        { nombre: 'test2.jpg', contenido: 'NPK 15-15-15' },
        { nombre: 'test3.jpg', contenido: 'AZUFRE 80% WG' }
      ];
      
      const start = Date.now();
      const response = await request.post('http://localhost:3002/api/ocr/batch', {
        data: { imagenes: images }
      });
      const duration = Date.now() - start;
      
      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(2000);
      
      console.log(`OCR batch processing (3 images): ${duration}ms`);
    });
  });

  test('Cache performance improvements', async ({ request }) => {
    
    await test.step('SIGPAC cache performance', async () => {
      const reference = '28:079:0001:00001:0001:WX';
      
      // First request (cache miss)
      const start1 = Date.now();
      const response1 = await request.get(`http://localhost:3002/api/sigpac/parcela/${reference}`);
      const duration1 = Date.now() - start1;
      expect(response1.ok()).toBeTruthy();
      
      // Second request (cache hit)
      const start2 = Date.now();
      const response2 = await request.get(`http://localhost:3002/api/sigpac/parcela/${reference}`);
      const duration2 = Date.now() - start2;
      expect(response2.ok()).toBeTruthy();
      
      // Cache should provide significant improvement
      const improvement = ((duration1 - duration2) / duration1) * 100;
      expect(improvement).toBeGreaterThan(50); // At least 50% faster
      
      console.log(`SIGPAC cache: ${duration1}ms → ${duration2}ms (${improvement.toFixed(1)}% improvement)`);
    });

    await test.step('Weather cache performance', async () => {
      const coords = 'lat=40.4168&lng=-3.7038';
      
      // First request
      const start1 = Date.now();
      const response1 = await request.get(`http://localhost:3002/api/weather/current?${coords}`);
      const duration1 = Date.now() - start1;
      expect(response1.ok()).toBeTruthy();
      
      // Second request (should hit cache)
      const start2 = Date.now();
      const response2 = await request.get(`http://localhost:3002/api/weather/current?${coords}`);
      const duration2 = Date.now() - start2;
      expect(response2.ok()).toBeTruthy();
      
      // Cache should improve performance
      expect(duration2).toBeLessThan(duration1);
      
      console.log(`Weather cache: ${duration1}ms → ${duration2}ms`);
    });
  });

  test('Concurrent request handling', async ({ request }) => {
    
    await test.step('Handle 10 concurrent SIGPAC requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        request.get(`http://localhost:3002/api/sigpac/test?n=${i}`)
      );
      
      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.ok()).toBeTruthy();
      });
      
      // Should handle concurrency efficiently
      expect(duration).toBeLessThan(2000);
      
      console.log(`10 concurrent SIGPAC requests: ${duration}ms`);
    });

    await test.step('Handle 5 concurrent weather requests', async () => {
      const coords = [
        { lat: 40.4168, lng: -3.7038 }, // Madrid
        { lat: 41.3851, lng: 2.1734 },  // Barcelona
        { lat: 37.3886, lng: -5.9823 }, // Sevilla
        { lat: 39.4699, lng: -0.3763 }, // Valencia
        { lat: 43.3619, lng: -8.4115 }  // A Coruña
      ];
      
      const requests = coords.map(coord => 
        request.get(`http://localhost:3002/api/weather/current?lat=${coord.lat}&lng=${coord.lng}`)
      );
      
      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.ok()).toBeTruthy();
      });
      
      // Should handle concurrency efficiently
      expect(duration).toBeLessThan(3000);
      
      console.log(`5 concurrent weather requests: ${duration}ms`);
    });
  });

  test('Memory and resource usage', async ({ request }) => {
    
    await test.step('Large dataset handling', async () => {
      // Test coordinate search with large radius
      const start = Date.now();
      const response = await request.post('http://localhost:3002/api/sigpac/parcelas/search', {
        data: { lat: 40.4168, lng: -3.7038, radius: 10000 } // 10km radius
      });
      const duration = Date.now() - start;
      
      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(2000);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
      
      console.log(`Large radius search (10km): ${duration}ms, ${data.length} results`);
    });

    await test.step('Extended forecast request', async () => {
      const start = Date.now();
      const response = await request.get(
        'http://localhost:3002/api/weather/forecast?lat=40.4168&lng=-3.7038&days=7'
      );
      const duration = Date.now() - start;
      
      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(1000);
      
      const forecast = await response.json();
      expect(forecast).toHaveLength(7);
      
      console.log(`7-day forecast: ${duration}ms`);
    });
  });

  test('Error response times', async ({ request }) => {
    
    await test.step('Invalid requests should fail fast', async () => {
      const invalidRequests = [
        { url: 'http://localhost:3002/api/sigpac/parcela/INVALID', expectedStatus: 400 },
        { url: 'http://localhost:3002/api/weather/current?lat=999&lng=999', expectedStatus: 400 },
        { url: 'http://localhost:3002/api/ocr/job/non-existent', expectedStatus: 404 },
        { url: 'http://localhost:3002/api/nonexistent', expectedStatus: 404 }
      ];
      
      for (const { url, expectedStatus } of invalidRequests) {
        const start = Date.now();
        const response = await request.get(url);
        const duration = Date.now() - start;
        
        expect(response.status()).toBe(expectedStatus);
        expect(duration).toBeLessThan(200); // Error responses should be fast
        
        console.log(`Error response ${expectedStatus}: ${duration}ms`);
      }
    });
  });

  test('Rate limiting performance', async ({ request }) => {
    
    await test.step('Rate limiting should not significantly impact performance', async () => {
      // Make requests within rate limit
      const requests = Array.from({ length: 5 }, (_, i) => 
        request.get(`http://localhost:3002/api/sigpac/health?t=${i}`)
      );
      
      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;
      
      // All should succeed
      responses.forEach(response => {
        expect(response.ok()).toBeTruthy();
      });
      
      // Should complete quickly
      expect(duration).toBeLessThan(1000);
      
      // Check rate limiting headers are present
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.headers()['x-ratelimit-remaining']).toBeDefined();
      
      console.log(`5 rate-limited requests: ${duration}ms`);
    });
  });
});