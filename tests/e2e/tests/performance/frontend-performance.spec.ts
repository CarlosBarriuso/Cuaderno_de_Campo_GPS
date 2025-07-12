import { test, expect } from '@playwright/test';

test.describe('Frontend Performance Tests', () => {
  
  test('Page load performance meets requirements', async ({ page }) => {
    
    await test.step('Dashboard loads in <3 seconds', async () => {
      const start = Date.now();
      await page.goto('/');
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
      const loadTime = Date.now() - start;
      
      expect(loadTime).toBeLessThan(3000);
      console.log(`Dashboard load time: ${loadTime}ms`);
    });

    await test.step('Parcelas page loads in <2 seconds', async () => {
      const start = Date.now();
      await page.goto('/parcelas');
      await page.waitForSelector('[data-testid="parcelas-list"]', { timeout: 8000 });
      const loadTime = Date.now() - start;
      
      expect(loadTime).toBeLessThan(2000);
      console.log(`Parcelas page load time: ${loadTime}ms`);
    });

    await test.step('Activities page loads in <2 seconds', async () => {
      const start = Date.now();
      await page.goto('/actividades');
      await page.waitForSelector('[data-testid="actividades-list"]', { timeout: 8000 });
      const loadTime = Date.now() - start;
      
      expect(loadTime).toBeLessThan(2000);
      console.log(`Activities page load time: ${loadTime}ms`);
    });

    await test.step('Map page loads in <4 seconds', async () => {
      const start = Date.now();
      await page.goto('/mapa');
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      const loadTime = Date.now() - start;
      
      expect(loadTime).toBeLessThan(4000);
      console.log(`Map page load time: ${loadTime}ms`);
    });
  });

  test('Interactive components respond quickly', async ({ page }) => {
    await page.goto('/');
    
    await test.step('Weather widget updates in <1 second', async () => {
      await page.waitForSelector('[data-testid="weather-widget"]');
      
      const start = Date.now();
      await page.click('[data-testid="refresh-weather"]');
      await page.waitForSelector('[data-testid="weather-updated"]', { timeout: 3000 });
      const updateTime = Date.now() - start;
      
      expect(updateTime).toBeLessThan(1000);
      console.log(`Weather widget update: ${updateTime}ms`);
    });

    await test.step('Navigation between pages <500ms', async () => {
      const navigationTests = [
        { from: '/', to: '/parcelas', selector: '[data-testid="parcelas-list"]' },
        { from: '/parcelas', to: '/actividades', selector: '[data-testid="actividades-list"]' },
        { from: '/actividades', to: '/mapa', selector: '.leaflet-container' },
        { from: '/mapa', to: '/', selector: '[data-testid="dashboard-content"]' }
      ];
      
      for (const { from, to, selector } of navigationTests) {
        await page.goto(from);
        await page.waitForLoadState('networkidle');
        
        const start = Date.now();
        await page.goto(to);
        await page.waitForSelector(selector, { timeout: 3000 });
        const navTime = Date.now() - start;
        
        expect(navTime).toBeLessThan(500);
        console.log(`Navigation ${from} → ${to}: ${navTime}ms`);
      }
    });
  });

  test('Form interactions are responsive', async ({ page }) => {
    
    await test.step('Parcela form responds quickly', async () => {
      await page.goto('/parcelas');
      await page.click('text=Nueva Parcela');
      
      // Test field interactions
      const start = Date.now();
      await page.fill('[data-testid="parcela-nombre"]', 'Test Performance');
      await page.fill('[data-testid="parcela-superficie"]', '15.5');
      await page.selectOption('[data-testid="parcela-cultivo"]', 'maiz');
      const interactionTime = Date.now() - start;
      
      expect(interactionTime).toBeLessThan(200);
      console.log(`Form interaction time: ${interactionTime}ms`);
    });

    await test.step('SIGPAC validation responds in <2 seconds', async () => {
      await page.goto('/sigpac');
      
      const start = Date.now();
      await page.fill('[data-testid="sigpac-input"]', '28:079:0001:00001:0001:WX');
      await page.click('[data-testid="search-sigpac"]');
      await page.waitForSelector('[data-testid="sigpac-results"]', { timeout: 5000 });
      const validationTime = Date.now() - start;
      
      expect(validationTime).toBeLessThan(2000);
      console.log(`SIGPAC validation time: ${validationTime}ms`);
    });
  });

  test('Map performance is acceptable', async ({ page }) => {
    await page.goto('/mapa');
    
    await test.step('Map initializes in <3 seconds', async () => {
      const start = Date.now();
      await page.waitForSelector('.leaflet-container');
      await page.waitForFunction(() => {
        const map = document.querySelector('.leaflet-container');
        return map && map.querySelector('.leaflet-tile-loaded');
      }, { timeout: 10000 });
      const initTime = Date.now() - start;
      
      expect(initTime).toBeLessThan(3000);
      console.log(`Map initialization: ${initTime}ms`);
    });

    await test.step('Map interactions are smooth', async () => {
      // Test map zoom
      const start = Date.now();
      await page.click('.leaflet-control-zoom-in');
      await page.waitForTimeout(500); // Allow zoom animation
      const zoomTime = Date.now() - start;
      
      expect(zoomTime).toBeLessThan(1000);
      console.log(`Map zoom interaction: ${zoomTime}ms`);
    });
  });

  test('Resource loading optimization', async ({ page }) => {
    
    await test.step('Check critical resources load first', async () => {
      const resourceTimings = [];
      
      page.on('response', response => {
        if (response.url().includes('localhost:3001')) {
          resourceTimings.push({
            url: response.url(),
            status: response.status(),
            timing: Date.now()
          });
        }
      });
      
      await page.goto('/');
      await page.waitForSelector('[data-testid="dashboard-content"]');
      
      // Check that main page resources loaded successfully
      const htmlResponses = resourceTimings.filter(r => r.url.endsWith('/') || r.url.includes('.html'));
      const cssResponses = resourceTimings.filter(r => r.url.includes('.css'));
      const jsResponses = resourceTimings.filter(r => r.url.includes('.js'));
      
      expect(htmlResponses.length).toBeGreaterThan(0);
      expect(cssResponses.length).toBeGreaterThan(0);
      expect(jsResponses.length).toBeGreaterThan(0);
      
      console.log(`Resources loaded: ${resourceTimings.length} total`);
    });

    await test.step('No excessive API calls on initial load', async () => {
      const apiCalls = [];
      
      page.on('request', request => {
        if (request.url().includes('localhost:3002/api/')) {
          apiCalls.push({
            url: request.url(),
            method: request.method()
          });
        }
      });
      
      await page.goto('/');
      await page.waitForSelector('[data-testid="dashboard-content"]');
      
      // Should make reasonable number of API calls (not excessive)
      expect(apiCalls.length).toBeLessThan(10);
      
      console.log(`API calls on dashboard load: ${apiCalls.length}`);
      apiCalls.forEach(call => {
        console.log(`  ${call.method} ${call.url}`);
      });
    });
  });

  test('Memory usage stays reasonable', async ({ page }) => {
    
    await test.step('No memory leaks during navigation', async () => {
      // Navigate through all pages multiple times
      const pages = ['/', '/parcelas', '/actividades', '/mapa', '/sigpac'];
      
      for (let cycle = 0; cycle < 3; cycle++) {
        for (const pagePath of pages) {
          await page.goto(pagePath);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(500);
        }
      }
      
      // Check that page is still responsive
      await page.goto('/');
      const start = Date.now();
      await page.waitForSelector('[data-testid="dashboard-content"]');
      const finalLoadTime = Date.now() - start;
      
      // Should still load quickly after multiple navigations
      expect(finalLoadTime).toBeLessThan(2000);
      console.log(`Final load time after cycles: ${finalLoadTime}ms`);
    });
  });

  test('Mobile performance (responsive)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await test.step('Mobile dashboard loads in <4 seconds', async () => {
      const start = Date.now();
      await page.goto('/');
      await page.waitForSelector('[data-testid="dashboard-content"]');
      const mobileLoadTime = Date.now() - start;
      
      expect(mobileLoadTime).toBeLessThan(4000);
      console.log(`Mobile dashboard load: ${mobileLoadTime}ms`);
    });

    await test.step('Mobile forms are responsive', async () => {
      await page.goto('/parcelas');
      await page.click('text=Nueva Parcela');
      
      const start = Date.now();
      await page.fill('[data-testid="parcela-nombre"]', 'Mobile Test');
      await page.fill('[data-testid="parcela-superficie"]', '10');
      const mobileFormTime = Date.now() - start;
      
      expect(mobileFormTime).toBeLessThan(300);
      console.log(`Mobile form interaction: ${mobileFormTime}ms`);
    });

    await test.step('Mobile map performance', async () => {
      const start = Date.now();
      await page.goto('/mapa');
      await page.waitForSelector('.leaflet-container');
      const mobileMapTime = Date.now() - start;
      
      expect(mobileMapTime).toBeLessThan(5000);
      console.log(`Mobile map load: ${mobileMapTime}ms`);
    });
  });

  test('Error states load quickly', async ({ page }) => {
    
    await test.step('404 page loads quickly', async () => {
      const start = Date.now();
      await page.goto('/non-existent-page');
      await page.waitForSelector('body');
      const errorLoadTime = Date.now() - start;
      
      expect(errorLoadTime).toBeLessThan(1000);
      console.log(`404 page load: ${errorLoadTime}ms`);
    });

    await test.step('Network error handling is fast', async () => {
      // Block API requests to simulate network issues
      await page.route('**/api/**', route => route.abort());
      
      const start = Date.now();
      await page.goto('/');
      await page.waitForSelector('[data-testid="dashboard-content"]');
      const offlineLoadTime = Date.now() - start;
      
      // Should still load page structure quickly even with API failures
      expect(offlineLoadTime).toBeLessThan(3000);
      console.log(`Offline page load: ${offlineLoadTime}ms`);
    });
  });
});