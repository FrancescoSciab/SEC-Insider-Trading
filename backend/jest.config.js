module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',       // Entry point — integration tested separately
    '!src/utils/logger.js', // Logger wrapper — no logic to test
  ],
  coverageThresholds: {
    global: {
      // Start low — increase these as you add more tests
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  // Mock mongoose and node-cron — don't hit real DB in unit tests
  moduleNameMapper: {
    '^mongoose$': '<rootDir>/__mocks__/mongoose.js',
  },
  testTimeout: 10000,
  verbose: true,
};
