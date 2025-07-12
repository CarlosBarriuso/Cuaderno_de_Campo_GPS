/** @type {import('jest').Config} */
module.exports = {
  rootDir: '../../../',
  testMatch: ['<rootDir>/tests/mobile/detox/**/*.spec.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results/detox',
      outputName: 'junit.xml'
    }]
  ],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/mobile/detox/setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'apps/mobile/src/**/*.{js,jsx,ts,tsx}',
    '!apps/mobile/src/**/*.d.ts',
    '!apps/mobile/src/**/__tests__/**',
    '!apps/mobile/src/**/*.test.{js,jsx,ts,tsx}',
    '!apps/mobile/src/**/*.spec.{js,jsx,ts,tsx}'
  ]
};