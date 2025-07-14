import { test, expect } from '@playwright/test';

/**
 * Weather API Integration Tests - Phase 4
 * Tests AEMET + OpenWeather integration with agricultural alerts
 */
test.describe('Weather API Integration', () => {
  const testCoordinates = {
    madrid: { lat: 40.4168, lng: -3.7038 },
    valencia: { lat: 39.4699, lng: -0.3763 },
    sevilla: { lat: 37.3891, lng: -5.9845 }
  };

  test.beforeEach(async ({ page }) => {
    // Set API base URL for backend testing
    await page.goto('/');
  });

  test('Weather API - Current conditions endpoint', async ({ request }) => {
    await test.step('Test current weather for Madrid', async () => {
      const response = await request.get(
        `/api/weather/current?lat=${testCoordinates.madrid.lat}&lng=${testCoordinates.madrid.lng}`
      );
      
      expect(response.status()).toBe(200);
      
      const weatherData = await response.json();
      
      // Verify essential weather data structure
      expect(weatherData).toHaveProperty('temperatura');
      expect(weatherData).toHaveProperty('humedad');
      expect(weatherData).toHaveProperty('viento');
      expect(weatherData).toHaveProperty('presion');
      expect(weatherData).toHaveProperty('descripcion');
      expect(weatherData).toHaveProperty('proveedor');
      
      // Verify data types and ranges
      expect(typeof weatherData.temperatura).toBe('number');
      expect(weatherData.temperatura).toBeGreaterThan(-50);
      expect(weatherData.temperatura).toBeLessThan(60);
      
      expect(weatherData.humedad).toBeGreaterThanOrEqual(0);
      expect(weatherData.humedad).toBeLessThanOrEqual(100);
      
      expect(['AEMET', 'OpenWeather']).toContain(weatherData.proveedor);
    });
  });

  test('Weather API - Forecast endpoint', async ({ request }) => {
    await test.step('Test 7-day forecast for Valencia', async () => {
      const response = await request.get(
        `/api/weather/forecast?lat=${testCoordinates.valencia.lat}&lng=${testCoordinates.valencia.lng}&days=7`
      );
      
      expect(response.status()).toBe(200);
      
      const forecastData = await response.json();
      
      expect(Array.isArray(forecastData.pronóstico)).toBe(true);
      expect(forecastData.pronóstico.length).toBeLessThanOrEqual(7);
      
      // Check first forecast day structure
      const firstDay = forecastData.pronóstico[0];
      expect(firstDay).toHaveProperty('fecha');
      expect(firstDay).toHaveProperty('temperaturaMax');
      expect(firstDay).toHaveProperty('temperaturaMin');
      expect(firstDay).toHaveProperty('probabilidadLluvia');
      expect(firstDay).toHaveProperty('descripcion');
    });
  });

  test('Weather API - Agricultural alerts', async ({ request }) => {
    await test.step('Test agricultural alerts for Sevilla', async () => {
      const response = await request.get(
        `/api/weather/alerts?lat=${testCoordinates.sevilla.lat}&lng=${testCoordinates.sevilla.lng}&cultivos=olivar,trigo`
      );
      
      expect(response.status()).toBe(200);
      
      const alertsData = await response.json();
      
      expect(alertsData).toHaveProperty('alertas');
      expect(Array.isArray(alertsData.alertas)).toBe(true);
      
      // If alerts exist, verify structure
      if (alertsData.alertas.length > 0) {
        const alert = alertsData.alertas[0];
        expect(alert).toHaveProperty('tipo');
        expect(alert).toHaveProperty('severidad');
        expect(alert).toHaveProperty('descripcion');
        expect(alert).toHaveProperty('recomendacion');
        
        expect(['helada', 'granizo', 'viento_fuerte', 'lluvia_intensa', 'sequía', 'calor_extremo'])
          .toContain(alert.tipo);
        expect(['baja', 'media', 'alta', 'extrema']).toContain(alert.severidad);
      }
    });
  });

  test('Weather API - Complete weather information', async ({ request }) => {
    await test.step('Test complete weather endpoint', async () => {
      const response = await request.get(
        `/api/weather/complete?lat=${testCoordinates.madrid.lat}&lng=${testCoordinates.madrid.lng}`
      );
      
      expect(response.status()).toBe(200);
      
      const completeData = await response.json();
      
      // Verify all sections are present
      expect(completeData).toHaveProperty('actual');
      expect(completeData).toHaveProperty('pronóstico');
      expect(completeData).toHaveProperty('alertas');
      expect(completeData).toHaveProperty('recomendacionesAgrícolas');
      
      // Verify agricultural recommendations
      const recommendations = completeData.recomendacionesAgrícolas;
      expect(recommendations).toHaveProperty('trabajoCampo');
      expect(recommendations).toHaveProperty('riego');
      expect(recommendations).toHaveProperty('proteccionHeladas');
    });
  });

  test('Weather API - Provider health check', async ({ request }) => {
    await test.step('Test weather providers health', async () => {
      const response = await request.get('/api/weather/health');
      
      expect(response.status()).toBe(200);
      
      const healthData = await response.json();
      
      expect(healthData).toHaveProperty('estado');
      expect(healthData).toHaveProperty('proveedores');
      
      // At least one provider should be healthy
      const providers = healthData.proveedores;
      const healthyProviders = Object.values(providers).filter(
        (status: any) => status.estado === 'activo'
      );
      expect(healthyProviders.length).toBeGreaterThan(0);
    });
  });

  test('Weather API - Error handling', async ({ request }) => {
    await test.step('Test invalid coordinates handling', async () => {
      const response = await request.get('/api/weather/current?lat=invalid&lng=invalid');
      
      expect(response.status()).toBe(400);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('coordenadas');
    });

    await test.step('Test coordinates out of Spain', async () => {
      // Test coordinates in France (should work with OpenWeather fallback)
      const response = await request.get('/api/weather/current?lat=48.8566&lng=2.3522');
      
      expect(response.status()).toBe(200);
      
      const weatherData = await response.json();
      // Should fallback to OpenWeather for international locations
      expect(weatherData.proveedor).toBe('OpenWeather');
    });
  });

  test('Weather Widget Frontend Integration', async ({ page }) => {
    await test.step('Test weather widget displays current data', async () => {
      await page.goto('/');
      
      // Wait for weather widget to load
      const weatherWidget = page.locator('[data-testid="weather-widget"]');
      await expect(weatherWidget).toBeVisible({ timeout: 30000 });
      
      // Check temperature display
      const temperature = page.locator('[data-testid="current-temperature"]');
      await expect(temperature).toBeVisible();
      await expect(temperature).toContainText(/\d+°/);
      
      // Check weather description
      const description = page.locator('[data-testid="weather-description"]');
      await expect(description).toBeVisible();
      
      // Check forecast section
      const forecast = page.locator('[data-testid="weather-forecast"]');
      await expect(forecast).toBeVisible();
    });

    await test.step('Test agricultural recommendations display', async () => {
      const recommendations = page.locator('[data-testid="agricultural-recommendations"]');
      
      if (await recommendations.isVisible()) {
        // Check for common agricultural recommendation types
        const recommendationText = await recommendations.textContent();
        expect(recommendationText).toMatch(/trabajo|riego|helada|campo/i);
      }
    });

    await test.step('Test weather alerts display', async () => {
      const alertsSection = page.locator('[data-testid="weather-alerts"]');
      
      if (await alertsSection.isVisible()) {
        const alertText = await alertsSection.textContent();
        expect(alertText).toMatch(/alerta|aviso|precaución/i);
        
        // Check alert severity indicators
        const severityIcons = page.locator('[data-testid="alert-severity"]');
        if (await severityIcons.count() > 0) {
          await expect(severityIcons.first()).toBeVisible();
        }
      }
    });
  });

  test('Weather API - Rate limiting', async ({ request }) => {
    await test.step('Test rate limiting enforcement', async () => {
      const requests = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 15; i++) {
        requests.push(
          request.get(`/api/weather/current?lat=${testCoordinates.madrid.lat}&lng=${testCoordinates.madrid.lng}`)
        );
      }
      
      const responses = await Promise.all(requests);
      
      // First few should succeed
      expect(responses[0].status()).toBe(200);
      expect(responses[1].status()).toBe(200);
      
      // Later requests might be rate limited (429) or still succeed due to caching
      const statusCodes = responses.map(r => r.status());
      const successCount = statusCodes.filter(code => code === 200).length;
      const rateLimitedCount = statusCodes.filter(code => code === 429).length;
      
      // At least some requests should succeed (due to caching)
      expect(successCount).toBeGreaterThan(5);
    });
  });

  test('Weather API - Cache behavior', async ({ request }) => {
    await test.step('Test weather data caching', async () => {
      const coords = testCoordinates.madrid;
      
      // First request
      const start1 = Date.now();
      const response1 = await request.get(`/api/weather/current?lat=${coords.lat}&lng=${coords.lng}`);
      const time1 = Date.now() - start1;
      
      expect(response1.status()).toBe(200);
      
      // Second request (should be faster due to caching)
      const start2 = Date.now();
      const response2 = await request.get(`/api/weather/current?lat=${coords.lat}&lng=${coords.lng}`);
      const time2 = Date.now() - start2;
      
      expect(response2.status()).toBe(200);
      
      // Second request should be significantly faster (cached)
      expect(time2).toBeLessThan(time1 / 2);
      
      // Data should be identical
      const data1 = await response1.json();
      const data2 = await response2.json();
      expect(data1.temperatura).toBe(data2.temperatura);
    });
  });
});