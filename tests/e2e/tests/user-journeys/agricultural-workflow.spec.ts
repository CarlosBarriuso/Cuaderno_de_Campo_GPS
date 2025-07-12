import { test, expect } from '@playwright/test';

test.describe('Agricultural Workflow - Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Start at the dashboard
    await page.goto('/');
  });

  test('Complete agricultural workflow: Registration → Parcela → Activity → Reports', async ({ page }) => {
    // Step 1: Navigate to parcelas and create a new one
    await test.step('Navigate to Parcelas', async () => {
      await page.click('text=Parcelas');
      await expect(page).toHaveURL('/parcelas');
      await expect(page.locator('h1')).toContainText('Gestión de Parcelas');
    });

    await test.step('Create new parcela with SIGPAC validation', async () => {
      await page.click('text=Nueva Parcela');
      
      // Fill basic information
      await page.fill('[data-testid="parcela-nombre"]', 'Parcela Test E2E');
      await page.fill('[data-testid="parcela-superficie"]', '10.5');
      await page.selectOption('[data-testid="parcela-cultivo"]', 'trigo');
      
      // Test SIGPAC reference validation
      await page.fill('[data-testid="parcela-sigpac"]', '28:079:0001:00001:0001:WX');
      await page.click('[data-testid="validate-sigpac"]');
      
      // Wait for SIGPAC validation
      await expect(page.locator('[data-testid="sigpac-validation-result"]')).toBeVisible();
      
      // Set GPS coordinates (mock coordinates for Madrid)
      await page.fill('[data-testid="parcela-lat"]', '40.4168');
      await page.fill('[data-testid="parcela-lng"]', '-3.7038');
      
      await page.click('[data-testid="submit-parcela"]');
      
      // Verify parcela was created
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('text=Parcela Test E2E')).toBeVisible();
    });

    // Step 2: Create agricultural activity
    await test.step('Navigate to Activities and create new activity', async () => {
      await page.click('text=Actividades');
      await expect(page).toHaveURL('/actividades');
      
      await page.click('text=Nueva Actividad');
      
      // Fill activity details
      await page.selectOption('[data-testid="actividad-parcela"]', 'Parcela Test E2E');
      await page.selectOption('[data-testid="actividad-tipo"]', 'siembra');
      await page.fill('[data-testid="actividad-fecha"]', '2025-01-12');
      await page.fill('[data-testid="actividad-descripcion"]', 'Siembra de trigo de invierno');
      
      // Add product information
      await page.fill('[data-testid="actividad-producto"]', 'Semilla de trigo variedad Chamorro');
      await page.fill('[data-testid="actividad-cantidad"]', '180');
      await page.selectOption('[data-testid="actividad-unidad"]', 'kg/ha');
      
      // Add cost information
      await page.fill('[data-testid="actividad-costo"]', '250.50');
      
      await page.click('[data-testid="submit-actividad"]');
      
      // Verify activity was created
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('text=Siembra de trigo de invierno')).toBeVisible();
    });

    // Step 3: Check weather information
    await test.step('Verify weather integration', async () => {
      await page.goto('/');
      
      // Check that weather widget is present and has data
      await expect(page.locator('[data-testid="weather-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="current-temperature"]')).toBeVisible();
      await expect(page.locator('[data-testid="weather-forecast"]')).toBeVisible();
      
      // Check for agricultural alerts if any
      const alertsLocator = page.locator('[data-testid="weather-alerts"]');
      if (await alertsLocator.isVisible()) {
        await expect(alertsLocator).toContainText('Alerta');
      }
    });

    // Step 4: View map integration
    await test.step('Verify map functionality', async () => {
      await page.click('text=Mapa');
      await expect(page).toHaveURL('/mapa');
      
      // Wait for map to load
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      
      // Verify parcela markers are visible
      await expect(page.locator('.leaflet-marker-pane')).toBeVisible();
    });

    // Step 5: Check analytics/dashboard
    await test.step('Verify dashboard analytics', async () => {
      await page.goto('/');
      
      // Check key metrics are displayed
      await expect(page.locator('[data-testid="total-parcelas"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-actividades"]')).toBeVisible();
      await expect(page.locator('[data-testid="superficie-total"]')).toBeVisible();
      
      // Verify our created data appears in summary
      await expect(page.locator('text=1')).toBeVisible(); // 1 parcela
      await expect(page.locator('text=10.5')).toBeVisible(); // 10.5 ha
    });
  });

  test('SIGPAC validation workflow', async ({ page }) => {
    await test.step('Test SIGPAC page functionality', async () => {
      await page.goto('/sigpac');
      
      // Test valid SIGPAC reference
      await page.fill('[data-testid="sigpac-input"]', '28:079:0001:00001:0001:WX');
      await page.click('[data-testid="search-sigpac"]');
      
      // Wait for results
      await expect(page.locator('[data-testid="sigpac-results"]')).toBeVisible({ timeout: 15000 });
      
      // Verify result contains expected information
      await expect(page.locator('[data-testid="sigpac-provincia"]')).toContainText('Madrid');
      await expect(page.locator('[data-testid="sigpac-superficie"]')).toBeVisible();
    });

    await test.step('Test invalid SIGPAC reference handling', async () => {
      await page.fill('[data-testid="sigpac-input"]', 'INVALID:REFERENCE');
      await page.click('[data-testid="search-sigpac"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="sigpac-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="sigpac-error"]')).toContainText('inválida');
    });
  });

  test('Weather alerts and recommendations', async ({ page }) => {
    await test.step('Test weather data display', async () => {
      await page.goto('/');
      
      // Check weather widget shows current conditions
      const weatherWidget = page.locator('[data-testid="weather-widget"]');
      await expect(weatherWidget).toBeVisible();
      
      // Check forecast is displayed
      await expect(page.locator('[data-testid="weather-forecast-day-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="weather-forecast-day-2"]')).toBeVisible();
      
      // Check agricultural recommendations appear
      const recommendations = page.locator('[data-testid="agricultural-recommendations"]');
      if (await recommendations.isVisible()) {
        await expect(recommendations).toContainText(/trabajo|riego|helada/i);
      }
    });
  });

  test('Error handling and fallbacks', async ({ page }) => {
    await test.step('Test network error handling', async () => {
      // Simulate offline condition
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/');
      
      // Should show offline indicators or cached data
      // This tests the fallback mechanisms
      await expect(page).not.toHaveTitle(/Error/);
    });
  });
});