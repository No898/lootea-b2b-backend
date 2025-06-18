module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/tests/e2e/**/*.test.js'],
    setupFilesAfterEnv: ['<rootDir>/tests/e2e-setup.js'],
    testTimeout: 30000,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    maxWorkers: 1
}; 