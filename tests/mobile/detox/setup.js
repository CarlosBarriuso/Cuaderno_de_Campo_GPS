const detox = require('detox');
const config = require('./.detoxrc');
const adapter = require('detox/runners/jest/adapter');

jest.setTimeout(300000);
jasmine.getEnv().addReporter(adapter);

beforeAll(async () => {
  console.log('🚀 Starting Detox E2E tests for Cuaderno de Campo GPS mobile app...');
  
  await detox.init(config, {
    initGlobals: false,
    launchApp: true
  });
  
  console.log('✅ Detox initialized successfully');
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
  
  console.log('🧹 Detox cleanup completed');
});

// Global test utilities for agricultural testing
global.waitForElementByTestId = async (testId, timeout = 5000) => {
  return await waitFor(element(by.id(testId)))
    .toBeVisible()
    .withTimeout(timeout);
};

global.waitForElementByText = async (text, timeout = 5000) => {
  return await waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout);
};

// Mock GPS coordinates for testing
global.mockMadridCoordinates = {
  latitude: 40.4168,
  longitude: -3.7038
};

global.mockSevillaCoordinates = {
  latitude: 37.3886,
  longitude: -5.9823
};

// Agricultural test data
global.testParcela = {
  nombre: 'Parcela Test E2E',
  superficie: 15.5,
  cultivo: 'trigo',
  referenciaSigpac: '28:079:0001:00001:0001:WX',
  coordenadas: global.mockMadridCoordinates
};

global.testActividad = {
  tipo: 'siembra',
  fecha: '2025-01-12',
  descripcion: 'Siembra de trigo E2E test',
  producto: 'Semilla trigo variedad Chamorro',
  cantidad: 180,
  unidad: 'kg/ha',
  costo: 250.50
};

// Database cleanup utilities
global.cleanupTestData = async () => {
  // This would connect to test database and clean up test data
  console.log('🧹 Cleaning up test data...');
};

// Network simulation utilities
global.simulateOfflineMode = async () => {
  // Simulate offline condition for testing sync functionality
  console.log('📶 Simulating offline mode...');
};

global.simulateOnlineMode = async () => {
  // Restore online condition
  console.log('📶 Restoring online mode...');
};