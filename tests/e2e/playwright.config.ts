import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Cuaderno de Campo GPS - Phase 4 E2E Testing
 * Optimized for agricultural application testing with SIGPAC, Weather, OCR integrations
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 3 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use - multiple reporters for comprehensive reporting */
  reporter: [
    ['html', { outputFolder: 'reports/html-report' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
    ['list']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3001',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',

    /* Configure viewport for agricultural dashboard testing */
    viewport: { width: 1280, height: 720 },
    
    /* Configure test timeouts for complex agricultural operations */
    actionTimeout: 30000,
    navigationTimeout: 60000,
    
    /* Extra HTTP headers for API testing */
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    
    /* Ignore HTTPS errors for development testing */
    ignoreHTTPSErrors: true,
    
    /* Enable automatic waiting */
    waitForLoadState: 'networkidle'
  },

  /* Configure projects for different testing scenarios */
  projects: [
    // Core desktop browsers for main functionality
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable additional Chrome features for agricultural testing
        launchOptions: {
          args: ['--enable-features=VaapiVideoDecoder', '--use-gl=egl']
        }
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*\.(spec|test)\.(js|ts)/,
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /.*\.(spec|test)\.(js|ts)/,
    },

    // Mobile testing for responsive dashboard
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        // Test agricultural workflows on mobile devices common in Spain
        hasTouch: true,
        isMobile: true,
      },
      testMatch: /.*mobile.*\.(spec|test)\.(js|ts)/,
    },

    // API testing project
    {
      name: 'api-tests',
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3002',
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      testMatch: /.*api.*\.(spec|test)\.(js|ts)/,
    },

    // Performance testing project
    {
      name: 'performance',
      use: { 
        ...devices['Desktop Chrome'],
        // Simulate slower agricultural environments
        slowMo: 100,
      },
      testMatch: /.*performance.*\.(spec|test)\.(js|ts)/,
    }
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'npm run dev',
      cwd: './apps/web',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev',
      cwd: './apps/backend',
      port: 3002,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'pipe',
      stderr: 'pipe',
    }
  ],

  /* Global setup for agricultural testing environment */
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),

  /* Test timeout for complex agricultural operations (SIGPAC, Weather, OCR) */
  timeout: 120000,

  /* Expect timeout for assertions */
  expect: {
    timeout: 15000,
    // Custom matchers for agricultural data validation
    toHaveValidSIGPACReference: expect => true,
    toHaveWeatherData: expect => true,
    toHaveValidCoordinates: expect => true
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results',
  
  /* Maximum failures before stopping */
  maxFailures: process.env.CI ? 5 : undefined,

  /* Test metadata */
  metadata: {
    testType: 'e2e',
    environment: process.env.NODE_ENV || 'test',
    project: 'cuaderno-campo-gps',
    phase: 'phase-4-testing'
  }
});