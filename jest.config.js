/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1',
    '^@/modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  clearMocks: true,
  forceExit: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};

module.exports = config;