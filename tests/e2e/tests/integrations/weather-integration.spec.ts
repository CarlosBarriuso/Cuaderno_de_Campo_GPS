import { test, expect } from '@playwright/test';

test.describe('Weather Integration Tests', () => {
  
  test('Weather API endpoints respond correctly', async ({ request }) => {
    const madridCoords = { lat: 40.4168, lng: -3.7038 };
    
    // Test health endpoint
    await test.step('Weather health check', async () => {
      const response = await request.get('http://localhost:3002/api/weather/health');
      expect(response.ok()).toBeTruthy();
      
      const health = await response.json();
      expect(health.status).toBe('healthy');
      expect(health.providers).toBeDefined();
      expect(health.providers.AEMET).toBeDefined();
      expect(health.providers.OpenWeather).toBeDefined();
    });

    // Test current weather endpoint
    await test.step('Current weather data', async () => {
      const response = await request.get(
        `http://localhost:3002/api/weather/current?lat=${madridCoords.lat}&lng=${madridCoords.lng}`
      );
      expect(response.ok()).toBeTruthy();
      
      const weather = await response.json();
      expect(weather.temperature).toBeDefined();
      expect(weather.humidity).toBeDefined();
      expect(weather.windSpeed).toBeDefined();
      expect(weather.pressure).toBeDefined();
      expect(weather.coordinates).toEqual(madridCoords);
      expect(weather.provider).toMatch(/AEMET|OpenWeather/);
    });

    // Test forecast endpoint
    await test.step('Weather forecast', async () => {
      const response = await request.get(
        `http://localhost:3002/api/weather/forecast?lat=${madridCoords.lat}&lng=${madridCoords.lng}&days=5`
      );
      expect(response.ok()).toBeTruthy();
      
      const forecast = await response.json();
      expect(Array.isArray(forecast)).toBeTruthy();
      expect(forecast.length).toBe(5);
      
      // Check forecast structure
      forecast.forEach(day => {
        expect(day.date).toBeDefined();
        expect(day.temperatureMax).toBeDefined();
        expect(day.temperatureMin).toBeDefined();
        expect(day.humidity).toBeDefined();
        expect(day.windSpeed).toBeDefined();
        expect(day.description).toBeDefined();
      });
    });

    // Test agricultural alerts
    await test.step('Agricultural alerts', async () => {
      const response = await request.get(
        `http://localhost:3002/api/weather/alerts?lat=${madridCoords.lat}&lng=${madridCoords.lng}&cultivos=trigo,cebada`
      );
      expect(response.ok()).toBeTruthy();
      
      const alerts = await response.json();
      expect(Array.isArray(alerts)).toBeTruthy();
      
      // Check alert structure if any alerts exist
      alerts.forEach(alert => {
        expect(alert.tipo).toMatch(/helada|granizo|viento_fuerte|lluvia_intensa|sequia|calor_extremo/);
        expect(alert.severidad).toMatch(/baja|media|alta|extrema/);
        expect(alert.descripcion).toBeDefined();
        expect(alert.recomendacion).toBeDefined();
        expect(alert.validFrom).toBeDefined();
        expect(alert.validTo).toBeDefined();
      });
    });

    // Test complete weather info
    await test.step('Complete weather information', async () => {
      const response = await request.get(
        `http://localhost:3002/api/weather/complete?lat=${madridCoords.lat}&lng=${madridCoords.lng}`
      );
      expect(response.ok()).toBeTruthy();
      
      const complete = await response.json();
      expect(complete.current).toBeDefined();
      expect(complete.forecast).toBeDefined();
      expect(complete.alerts).toBeDefined();
      expect(complete.agricultural_recommendations).toBeDefined();
      
      // Check agricultural recommendations
      const recommendations = complete.agricultural_recommendations;
      expect(recommendations.trabajo_campo).toBeDefined();
      expect(recommendations.riego).toBeDefined();
      expect(recommendations.proteccion_heladas).toBeDefined();
    });

    // Test provider status
    await test.step('Weather providers status', async () => {
      const response = await request.get('http://localhost:3002/api/weather/providers');
      expect(response.ok()).toBeTruthy();
      
      const providers = await response.json();
      expect(providers.AEMET).toBeDefined();
      expect(providers.OpenWeather).toBeDefined();
      
      // At least one provider should be healthy
      const healthyProviders = Object.values(providers).filter(p => p.healthy);
      expect(healthyProviders.length).toBeGreaterThan(0);
    });
  });

  test('Weather fallback mechanism', async ({ request }) => {
    await test.step('Test provider fallback', async () => {
      const madridCoords = { lat: 40.4168, lng: -3.7038 };
      
      // Make multiple requests to test fallback behavior
      const requests = Array.from({ length: 5 }, () => 
        request.get(`http://localhost:3002/api/weather/current?lat=${madridCoords.lat}&lng=${madridCoords.lng}`)
      );
      
      const responses = await Promise.all(requests);
      
      // All requests should succeed (fallback should work)
      responses.forEach(response => {
        expect(response.ok()).toBeTruthy();
      });
      
      // Check which providers were used
      const weatherData = await Promise.all(responses.map(r => r.json()));
      const providers = weatherData.map(w => w.provider);
      
      // Should have at least one working provider
      expect(providers.some(p => p === 'AEMET' || p === 'OpenWeather')).toBeTruthy();
    });
  });

  test('Weather caching behavior', async ({ request }) => {
    await test.step('Verify weather data caching', async () => {
      const coords = { lat: 40.4168, lng: -3.7038 };
      
      // First request (cache miss)
      const start1 = Date.now();
      const response1 = await request.get(
        `http://localhost:3002/api/weather/current?lat=${coords.lat}&lng=${coords.lng}`
      );
      const time1 = Date.now() - start1;
      expect(response1.ok()).toBeTruthy();
      
      // Second request (should hit cache)
      const start2 = Date.now();
      const response2 = await request.get(
        `http://localhost:3002/api/weather/current?lat=${coords.lat}&lng=${coords.lng}`
      );
      const time2 = Date.now() - start2;
      expect(response2.ok()).toBeTruthy();
      
      // Cache hit should be faster
      expect(time2).toBeLessThan(time1 * 0.7);
      
      // Data should be similar (allowing for timestamp differences)
      const data1 = await response1.json();
      const data2 = await response2.json();
      expect(data1.temperature).toBeCloseTo(data2.temperature, 1);
      expect(data1.humidity).toBeCloseTo(data2.humidity, 5);
    });
  });

  test('Agricultural alerts accuracy', async ({ request }) => {
    await test.step('Test frost alerts', async () => {
      // Test with coordinates where frost might occur
      const response = await request.get(
        'http://localhost:3002/api/weather/alerts?lat=42.0&lng=-4.0&cultivos=vid'
      );
      expect(response.ok()).toBeTruthy();
      
      const alerts = await response.json();
      
      // If frost alerts exist, verify they have proper recommendations
      const frostAlerts = alerts.filter(a => a.tipo === 'helada');
      frostAlerts.forEach(alert => {
        expect(alert.recomendacion).toContain('protección');
        expect(alert.temperaturaMinima).toBeLessThan(5);
      });
    });

    await test.step('Test wind alerts', async () => {
      const response = await request.get(
        'http://localhost:3002/api/weather/alerts?lat=43.0&lng=-8.0&cultivos=maiz'
      );
      expect(response.ok()).toBeTruthy();
      
      const alerts = await response.json();
      
      // Check wind alerts structure
      const windAlerts = alerts.filter(a => a.tipo === 'viento_fuerte');
      windAlerts.forEach(alert => {
        expect(alert.velocidadViento).toBeGreaterThan(25);
        expect(alert.recomendacion).toMatch(/evitar|posponer|proteger/i);
      });
    });
  });

  test('Weather error handling', async ({ request }) => {
    await test.step('Handle invalid coordinates', async () => {
      const response = await request.get(
        'http://localhost:3002/api/weather/current?lat=999&lng=999'
      );
      expect(response.status()).toBe(400);
      
      const error = await response.json();
      expect(error.error).toContain('coordenadas');
    });

    await test.step('Handle missing coordinates', async () => {
      const response = await request.get('http://localhost:3002/api/weather/current');
      expect(response.status()).toBe(400);
      
      const error = await response.json();
      expect(error.error).toContain('requeridas');
    });

    await test.step('Handle invalid forecast days', async () => {
      const response = await request.get(
        'http://localhost:3002/api/weather/forecast?lat=40.4168&lng=-3.7038&days=20'
      );
      expect(response.status()).toBe(400);
      
      const error = await response.json();
      expect(error.error).toContain('días');
    });
  });

  test('Weather data accuracy', async ({ request }) => {
    await test.step('Verify temperature ranges', async () => {
      const response = await request.get(
        'http://localhost:3002/api/weather/current?lat=40.4168&lng=-3.7038'
      );
      expect(response.ok()).toBeTruthy();
      
      const weather = await response.json();
      
      // Temperature should be within reasonable range for Spain
      expect(weather.temperature).toBeGreaterThan(-20);
      expect(weather.temperature).toBeLessThan(50);
      
      // Humidity should be percentage
      expect(weather.humidity).toBeGreaterThanOrEqual(0);
      expect(weather.humidity).toBeLessThanOrEqual(100);
      
      // Wind speed should be reasonable
      expect(weather.windSpeed).toBeGreaterThanOrEqual(0);
      expect(weather.windSpeed).toBeLessThan(200);
      
      // Pressure should be within atmospheric range
      expect(weather.pressure).toBeGreaterThan(900);
      expect(weather.pressure).toBeLessThan(1100);
    });
  });

  test('Weather rate limiting', async ({ request }) => {
    await test.step('Verify weather API rate limiting', async () => {
      const coords = { lat: 40.4168, lng: -3.7038 };
      
      // Make multiple rapid requests
      const requests = Array.from({ length: 8 }, (_, i) => 
        request.get(`http://localhost:3002/api/weather/current?lat=${coords.lat}&lng=${coords.lng}&t=${i}`)
      );
      
      const responses = await Promise.all(requests);
      
      // All requests should complete successfully (rate limiting should queue, not reject)
      responses.forEach(response => {
        expect(response.ok()).toBeTruthy();
      });
      
      // Check rate limiting headers
      const lastResponse = responses[responses.length - 1];
      const rateLimitRemaining = lastResponse.headers()['x-ratelimit-remaining'];
      expect(rateLimitRemaining).toBeDefined();
    });
  });
});