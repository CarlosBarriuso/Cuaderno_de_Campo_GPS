import { test, expect } from '@playwright/test';

test.describe('SIGPAC Integration Tests', () => {
  
  test('SIGPAC API endpoints respond correctly', async ({ request }) => {
    // Test health endpoint
    await test.step('Health check endpoint', async () => {
      const response = await request.get('http://localhost:3002/api/sigpac/health');
      expect(response.ok()).toBeTruthy();
      
      const health = await response.json();
      expect(health.status).toBe('healthy');
      expect(health.service).toBe('SIGPAC');
    });

    // Test provinces endpoint
    await test.step('Provinces endpoint', async () => {
      const response = await request.get('http://localhost:3002/api/sigpac/provincias');
      expect(response.ok()).toBeTruthy();
      
      const provinces = await response.json();
      expect(Array.isArray(provinces)).toBeTruthy();
      expect(provinces.length).toBeGreaterThan(50); // Spain has 52 provinces
      
      // Check Madrid is included
      const madrid = provinces.find(p => p.codigo === '28');
      expect(madrid).toBeDefined();
      expect(madrid.nombre).toBe('Madrid');
    });

    // Test valid reference lookup
    await test.step('Valid SIGPAC reference lookup', async () => {
      const response = await request.get('http://localhost:3002/api/sigpac/parcela/28:079:0001:00001:0001:WX');
      expect(response.ok()).toBeTruthy();
      
      const parcela = await response.json();
      expect(parcela.referencia).toBe('28:079:0001:00001:0001:WX');
      expect(parcela.provincia).toBe('Madrid');
      expect(parcela.municipio).toBeDefined();
      expect(parcela.superficie).toBeGreaterThan(0);
    });

    // Test coordinate search
    await test.step('Coordinate-based search', async () => {
      const searchPayload = {
        lat: 40.4168,
        lng: -3.7038,
        radius: 1000
      };
      
      const response = await request.post('http://localhost:3002/api/sigpac/parcelas/search', {
        data: searchPayload
      });
      expect(response.ok()).toBeTruthy();
      
      const results = await response.json();
      expect(Array.isArray(results)).toBeTruthy();
      expect(results.length).toBeGreaterThan(0);
      
      // Check first result has expected structure
      const firstResult = results[0];
      expect(firstResult.referencia).toBeDefined();
      expect(firstResult.distancia).toBeDefined();
      expect(firstResult.superficie).toBeGreaterThan(0);
    });
  });

  test('SIGPAC reference validation', async ({ request }) => {
    await test.step('Validate multiple references', async () => {
      const references = [
        '28:079:0001:00001:0001:WX', // Valid Madrid
        '41:091:0001:00001:0001:AA', // Valid Sevilla
        '08:019:0001:00001:0001:BB', // Valid Barcelona
        'INVALID:REFERENCE:FORMAT',   // Invalid format
        '99:999:9999:99999:9999:ZZ'  // Invalid province
      ];
      
      const response = await request.post('http://localhost:3002/api/sigpac/referencias/validate', {
        data: { referencias }
      });
      expect(response.ok()).toBeTruthy();
      
      const validation = await response.json();
      expect(validation.total).toBe(5);
      expect(validation.validas).toBe(3);
      expect(validation.invalidas).toBe(2);
      
      // Check detailed results
      expect(validation.resultados).toHaveLength(5);
      
      // First three should be valid
      expect(validation.resultados[0].valida).toBeTruthy();
      expect(validation.resultados[1].valida).toBeTruthy();
      expect(validation.resultados[2].valida).toBeTruthy();
      
      // Last two should be invalid
      expect(validation.resultados[3].valida).toBeFalsy();
      expect(validation.resultados[4].valida).toBeFalsy();
    });
  });

  test('SIGPAC error handling', async ({ request }) => {
    await test.step('Handle invalid reference format', async () => {
      const response = await request.get('http://localhost:3002/api/sigpac/parcela/INVALID_FORMAT');
      expect(response.status()).toBe(400);
      
      const error = await response.json();
      expect(error.error).toContain('formato');
    });

    await test.step('Handle non-existent reference', async () => {
      const response = await request.get('http://localhost:3002/api/sigpac/parcela/99:999:9999:99999:9999:ZZ');
      expect(response.status()).toBe(404);
      
      const error = await response.json();
      expect(error.error).toContain('encontrada');
    });

    await test.step('Handle invalid coordinate search', async () => {
      const invalidPayload = {
        lat: 999, // Invalid latitude
        lng: -3.7038,
        radius: 1000
      };
      
      const response = await request.post('http://localhost:3002/api/sigpac/parcelas/search', {
        data: invalidPayload
      });
      expect(response.status()).toBe(400);
      
      const error = await response.json();
      expect(error.error).toContain('coordenadas');
    });
  });

  test('SIGPAC caching behavior', async ({ request }) => {
    await test.step('Verify cache improves response time', async () => {
      const reference = '28:079:0001:00001:0001:WX';
      
      // First request (cache miss)
      const start1 = Date.now();
      const response1 = await request.get(`http://localhost:3002/api/sigpac/parcela/${reference}`);
      const time1 = Date.now() - start1;
      expect(response1.ok()).toBeTruthy();
      
      // Second request (cache hit)
      const start2 = Date.now();
      const response2 = await request.get(`http://localhost:3002/api/sigpac/parcela/${reference}`);
      const time2 = Date.now() - start2;
      expect(response2.ok()).toBeTruthy();
      
      // Cache hit should be significantly faster
      expect(time2).toBeLessThan(time1 * 0.5);
      
      // Results should be identical
      const data1 = await response1.json();
      const data2 = await response2.json();
      expect(data1).toEqual(data2);
    });
  });

  test('SIGPAC rate limiting', async ({ request }) => {
    await test.step('Verify rate limiting works', async () => {
      // Make rapid requests to trigger rate limiting
      const requests = Array.from({ length: 10 }, (_, i) => 
        request.get(`http://localhost:3002/api/sigpac/test?n=${i}`)
      );
      
      const responses = await Promise.all(requests);
      
      // All requests should complete (rate limiting should queue, not reject)
      responses.forEach(response => {
        expect(response.ok()).toBeTruthy();
      });
      
      // Check that rate limiting headers are present
      const lastResponse = responses[responses.length - 1];
      const rateLimitRemaining = lastResponse.headers()['x-ratelimit-remaining'];
      expect(rateLimitRemaining).toBeDefined();
    });
  });

  test('SIGPAC geographic accuracy', async ({ request }) => {
    await test.step('Verify geographic calculations', async () => {
      // Test with known coordinates in Madrid
      const madridCoords = { lat: 40.4168, lng: -3.7038 };
      
      const response = await request.post('http://localhost:3002/api/sigpac/parcelas/search', {
        data: { ...madridCoords, radius: 5000 }
      });
      expect(response.ok()).toBeTruthy();
      
      const parcelas = await response.json();
      expect(parcelas.length).toBeGreaterThan(0);
      
      // Verify all returned parcelas are within the specified radius
      parcelas.forEach(parcela => {
        expect(parcela.distancia).toBeLessThanOrEqual(5000);
        expect(parcela.coordenadas).toBeDefined();
        expect(parcela.coordenadas.lat).toBeCloseTo(madridCoords.lat, 2);
        expect(parcela.coordenadas.lng).toBeCloseTo(madridCoords.lng, 2);
      });
    });
  });
});