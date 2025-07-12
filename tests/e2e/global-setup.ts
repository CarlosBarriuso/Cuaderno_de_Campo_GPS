import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🌾 Setting up Cuaderno de Campo GPS E2E testing environment...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for backend to be ready
    console.log('⏳ Waiting for backend API...');
    await page.goto('http://localhost:3002/health');
    const healthResponse = await page.textContent('pre');
    console.log('✅ Backend health check:', healthResponse);

    // Wait for frontend to be ready
    console.log('⏳ Waiting for frontend web app...');
    await page.goto('http://localhost:3001');
    await page.waitForSelector('body', { timeout: 30000 });
    console.log('✅ Frontend is ready');

    // Check SIGPAC integration health
    console.log('🗺️ Checking SIGPAC integration...');
    await page.goto('http://localhost:3002/api/sigpac/health');
    const sigpacHealth = await page.textContent('pre');
    console.log('✅ SIGPAC health:', sigpacHealth);

    // Check Weather API health
    console.log('🌤️ Checking Weather API...');
    await page.goto('http://localhost:3002/api/weather/health');
    const weatherHealth = await page.textContent('pre');
    console.log('✅ Weather API health:', weatherHealth);

    // Check OCR service health
    console.log('📷 Checking OCR service...');
    await page.goto('http://localhost:3002/api/ocr/health');
    const ocrHealth = await page.textContent('pre');
    console.log('✅ OCR service health:', ocrHealth);

    console.log('🎯 All services are ready for E2E testing!');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;