/**
 * Jest Setup for Cuaderno de Campo GPS Tests
 * Configuración global para tests de backend
 */

import { beforeAll, afterAll, jest, describe, it, expect } from '@jest/globals';

// Mock environment variables for testing
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/test_db';
  process.env.CLERK_SECRET_KEY = 'sk_test_mock_key';
  process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_mock_key';
  process.env.REDIS_URL = 'redis://localhost:6380';
  process.env.ENABLE_SIGPAC_SCRAPING = 'false';
  process.env.SIGPAC_RATE_LIMIT = '100';
  
  // Mock console methods for cleaner test output
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console methods
  jest.restoreAllMocks();
});

// Global test timeout
jest.setTimeout(30000);

// Add this dummy test to prevent "no tests" error
describe('Setup', () => {
  it('should setup test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});