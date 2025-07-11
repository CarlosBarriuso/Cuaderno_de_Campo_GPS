// Test setup file
import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.ENABLE_SIGPAC_SCRAPING = 'false';
process.env.SIGPAC_RATE_LIMIT = '100';