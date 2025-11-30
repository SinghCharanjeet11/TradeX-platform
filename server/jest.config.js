export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'providers/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    '!**/*.test.js'
  ],
  testTimeout: 30000 // 30 seconds default timeout
};
