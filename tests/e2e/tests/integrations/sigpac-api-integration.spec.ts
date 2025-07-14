import { test, expect } from '@playwright/test';

/**
 * SIGPAC API Integration Tests - Phase 4
 * Tests official Spanish SIGPAC integration with WMS services
 */
test.describe('SIGPAC API Integration', () => {
  // Valid SIGPAC references for testing (from different Spanish provinces)
  const testReferences = {
    madrid: '28:079:0001:00001:0001:WX',
    valencia: '46:233:0001:00001:0001:ZV',
    sevilla: '41:091:0001:00001:0001:AZ',
    invalid: 'INVALID:REFERENCE:FORMAT'
  };

  const testCoordinates = {
    madrid: { lat: 40.4168, lng: -3.7038 },
    valencia: { lat: 39.4699, lng: -0.3763 },
    rural_castilla: { lat: 41.6518, lng: -4.7245 }
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('SIGPAC API - Reference validation', async ({ request }) => {
    await test.step('Test valid SIGPAC reference parsing', async () => {
      const response = await request.post('/api/sigpac/validate', {
        data: { reference: testReferences.madrid }
      });
      
      expect(response.status()).toBe(200);
      
      const validationData = await response.json();
      
      expect(validationData).toHaveProperty('válida');
      expect(validationData.válida).toBe(true);
      expect(validationData).toHaveProperty('provincia');
      expect(validationData).toHaveProperty('municipio');
      expect(validationData).toHaveProperty('agregado');
      expect(validationData).toHaveProperty('zona');
      expect(validationData).toHaveProperty('polígono');
      expect(validationData).toHaveProperty('parcela');
      
      // Verify Madrid province
      expect(validationData.provincia).toBe('28');
      expect(validationData.municipio).toBe('079');
    });

    await test.step('Test invalid SIGPAC reference handling', async () => {
      const response = await request.post('/api/sigpac/validate', {
        data: { reference: testReferences.invalid }
      });
      
      expect(response.status()).toBe(400);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('inválida');
    });
  });

  test('SIGPAC API - Parcel information retrieval', async ({ request }) => {
    await test.step('Test parcel info for Madrid reference', async () => {
      const response = await request.get(`/api/sigpac/parcel/${testReferences.madrid}`);
      
      expect(response.status()).toBe(200);
      
      const parcelData = await response.json();
      
      expect(parcelData).toHaveProperty('referencia');
      expect(parcelData).toHaveProperty('superficie');
      expect(parcelData).toHaveProperty('coordenadas');
      expect(parcelData).toHaveProperty('uso');
      expect(parcelData).toHaveProperty('pendiente');
      
      // Verify data types
      expect(typeof parcelData.superficie).toBe('number');
      expect(parcelData.superficie).toBeGreaterThan(0);
      
      expect(Array.isArray(parcelData.coordenadas)).toBe(true);
      if (parcelData.coordenadas.length > 0) {
        const coord = parcelData.coordenadas[0];
        expect(coord).toHaveProperty('lat');
        expect(coord).toHaveProperty('lng');
      }
    });

    await test.step('Test multiple province support', async () => {
      const provinces = [testReferences.madrid, testReferences.valencia, testReferences.sevilla];
      
      for (const reference of provinces) {
        const response = await request.get(`/api/sigpac/parcel/${reference}`);
        
        if (response.status() === 200) {
          const data = await response.json();
          expect(data).toHaveProperty('referencia');
          expect(data.referencia).toBe(reference);
        } else {
          // Some references might not exist in test data, that's OK
          expect([404, 500]).toContain(response.status());
        }
      }
    });
  });

  test('SIGPAC API - Coordinate-based search', async ({ request }) => {
    await test.step('Test search by coordinates in Madrid', async () => {
      const coords = testCoordinates.madrid;
      const response = await request.get(
        `/api/sigpac/search/coordinates?lat=${coords.lat}&lng=${coords.lng}`
      );
      
      expect(response.status()).toBe(200);
      
      const searchData = await response.json();
      
      expect(searchData).toHaveProperty('parcelas');
      expect(Array.isArray(searchData.parcelas)).toBe(true);
      
      if (searchData.parcelas.length > 0) {
        const parcel = searchData.parcelas[0];
        expect(parcel).toHaveProperty('referencia');
        expect(parcel).toHaveProperty('distancia');
        expect(parcel).toHaveProperty('superficie');
        
        // Verify SIGPAC reference format
        expect(parcel.referencia).toMatch(/^\d{2}:\d{3}:\d{4}:\d{5}:\d{4}:[A-Z]{2}$/);
      }
    });

    await test.step('Test search radius parameter', async () => {
      const coords = testCoordinates.valencia;
      
      // Small radius search
      const smallRadius = await request.get(
        `/api/sigpac/search/coordinates?lat=${coords.lat}&lng=${coords.lng}&radius=100`
      );
      
      // Large radius search
      const largeRadius = await request.get(
        `/api/sigpac/search/coordinates?lat=${coords.lat}&lng=${coords.lng}&radius=1000`
      );
      
      expect(smallRadius.status()).toBe(200);
      expect(largeRadius.status()).toBe(200);
      
      const smallData = await smallRadius.json();
      const largeData = await largeRadius.json();
      
      // Large radius should return same or more parcels
      expect(largeData.parcelas.length).toBeGreaterThanOrEqual(smallData.parcelas.length);
    });
  });

  test('SIGPAC API - WMS service integration', async ({ request }) => {
    await test.step('Test WMS capabilities', async () => {
      const response = await request.get('/api/sigpac/wms/capabilities');
      
      expect(response.status()).toBe(200);
      
      const capabilities = await response.json();
      
      expect(capabilities).toHaveProperty('servicios');
      expect(Array.isArray(capabilities.servicios)).toBe(true);
      expect(capabilities.servicios.length).toBeGreaterThan(0);
      
      // Check for required WMS services
      const serviceNames = capabilities.servicios.map((s: any) => s.nombre);
      expect(serviceNames).toContain('SIGPAC');
    });

    await test.step('Test WMS layer retrieval', async () => {
      const coords = testCoordinates.madrid;
      const response = await request.get(
        `/api/sigpac/wms/layer?lat=${coords.lat}&lng=${coords.lng}&zoom=16&width=512&height=512`
      );
      
      // WMS might return image data or redirect
      expect([200, 302]).toContain(response.status());
      
      if (response.status() === 200) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toMatch(/image/);
      }
    });
  });

  test('SIGPAC API - Province and municipality data', async ({ request }) => {
    await test.step('Test provinces list', async () => {
      const response = await request.get('/api/sigpac/provinces');
      
      expect(response.status()).toBe(200);
      
      const provinces = await response.json();
      
      expect(Array.isArray(provinces)).toBe(true);
      expect(provinces.length).toBe(52); // 50 provinces + Ceuta + Melilla
      
      // Check for key Spanish provinces
      const provinceCodes = provinces.map((p: any) => p.codigo);
      expect(provinceCodes).toContain('28'); // Madrid
      expect(provinceCodes).toContain('08'); // Barcelona
      expect(provinceCodes).toContain('41'); // Sevilla
      expect(provinceCodes).toContain('46'); // Valencia
    });

    await test.step('Test municipalities for province', async () => {
      const response = await request.get('/api/sigpac/municipalities/28'); // Madrid
      
      expect(response.status()).toBe(200);
      
      const municipalities = await response.json();
      
      expect(Array.isArray(municipalities)).toBe(true);
      expect(municipalities.length).toBeGreaterThan(0);
      
      // Check for Madrid city
      const madridMunicipality = municipalities.find((m: any) => m.codigo === '079');
      expect(madridMunicipality).toBeDefined();
      expect(madridMunicipality.nombre).toContain('Madrid');
    });
  });

  test('SIGPAC Frontend Integration', async ({ page }) => {
    await test.step('Test SIGPAC search page functionality', async () => {
      await page.goto('/sigpac');
      
      // Check page loads correctly
      await expect(page.locator('h1')).toContainText(/SIGPAC/i);
      
      // Test search form
      const searchInput = page.locator('[data-testid="sigpac-input"]');
      await expect(searchInput).toBeVisible();
      
      // Fill valid SIGPAC reference
      await searchInput.fill(testReferences.madrid);
      
      // Submit search
      const searchButton = page.locator('[data-testid="search-sigpac"]');
      await searchButton.click();
      
      // Wait for results
      await expect(page.locator('[data-testid="sigpac-results"]')).toBeVisible({ timeout: 30000 });
      
      // Verify results contain expected data
      await expect(page.locator('[data-testid="sigpac-provincia"]')).toBeVisible();
      await expect(page.locator('[data-testid="sigpac-superficie"]')).toBeVisible();
    });

    await test.step('Test SIGPAC integration in parcela form', async () => {
      await page.goto('/parcelas');
      await page.click('text=Nueva Parcela');
      
      // Check SIGPAC validation in parcela form
      const sigpacInput = page.locator('[data-testid="parcela-sigpac"]');
      await sigpacInput.fill(testReferences.madrid);
      
      const validateButton = page.locator('[data-testid="validate-sigpac"]');
      await validateButton.click();
      
      // Wait for validation result
      await expect(page.locator('[data-testid="sigpac-validation-result"]')).toBeVisible({ timeout: 15000 });
      
      // Check if coordinates are auto-filled
      const latInput = page.locator('[data-testid="parcela-lat"]');
      const lngInput = page.locator('[data-testid="parcela-lng"]');
      
      // Coordinates might be auto-filled from SIGPAC data
      await expect(latInput).not.toHaveValue('');
      await expect(lngInput).not.toHaveValue('');
    });
  });

  test('SIGPAC API - Error handling and resilience', async ({ request }) => {
    await test.step('Test malformed reference handling', async () => {
      const malformedRefs = [
        '28:079:0001', // Too short
        '28:079:0001:00001:0001:WX:EXTRA', // Too long
        '99:999:9999:99999:9999:ZZ', // Invalid province
        '' // Empty
      ];
      
      for (const ref of malformedRefs) {
        const response = await request.post('/api/sigpac/validate', {
          data: { reference: ref }
        });
        
        expect(response.status()).toBe(400);
        
        const errorData = await response.json();
        expect(errorData).toHaveProperty('error');
      }
    });

    await test.step('Test service unavailability fallback', async () => {
      // Test with coordinates that might trigger fallback services
      const coords = testCoordinates.rural_castilla;
      const response = await request.get(
        `/api/sigpac/search/coordinates?lat=${coords.lat}&lng=${coords.lng}`
      );
      
      // Should either succeed or fail gracefully
      if (response.status() !== 200) {
        expect([404, 503, 504]).toContain(response.status());
        
        const errorData = await response.json();
        expect(errorData).toHaveProperty('error');
        expect(errorData.error).toMatch(/servicio|disponible|conexión/i);
      }
    });
  });

  test('SIGPAC API - Performance and caching', async ({ request }) => {
    await test.step('Test response times', async () => {
      const start = Date.now();
      const response = await request.get(`/api/sigpac/parcel/${testReferences.madrid}`);
      const responseTime = Date.now() - start;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    await test.step('Test caching behavior', async () => {
      const reference = testReferences.madrid;
      
      // First request
      const start1 = Date.now();
      const response1 = await request.get(`/api/sigpac/parcel/${reference}`);
      const time1 = Date.now() - start1;
      
      expect(response1.status()).toBe(200);
      
      // Second request (should be cached)
      const start2 = Date.now();
      const response2 = await request.get(`/api/sigpac/parcel/${reference}`);
      const time2 = Date.now() - start2;
      
      expect(response2.status()).toBe(200);
      
      // Second request should be faster due to caching
      expect(time2).toBeLessThan(time1 / 2);
      
      // Data should be identical
      const data1 = await response1.json();
      const data2 = await response2.json();
      expect(data1.referencia).toBe(data2.referencia);
      expect(data1.superficie).toBe(data2.superficie);
    });
  });

  test('SIGPAC API - Health monitoring', async ({ request }) => {
    await test.step('Test SIGPAC health check', async () => {
      const response = await request.get('/api/sigpac/health');
      
      expect(response.status()).toBe(200);
      
      const healthData = await response.json();
      
      expect(healthData).toHaveProperty('estado');
      expect(healthData).toHaveProperty('servicios');
      expect(healthData).toHaveProperty('última_verificación');
      
      // Verify service status structure
      expect(healthData.servicios).toHaveProperty('sigpac_oficial');
      expect(healthData.servicios).toHaveProperty('wms_primario');
      
      // At least one service should be operational
      const services = Object.values(healthData.servicios);
      const operationalServices = services.filter((service: any) => service.estado === 'operativo');
      expect(operationalServices.length).toBeGreaterThan(0);
    });
  });
});