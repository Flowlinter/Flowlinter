module.exports = {
    testMatch: ['**/src/**/*.test.js'],
    setupFiles: ['dotenv/config'], // This will load environment variables from a .env file before running tests
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    
    testTimeout: 30000, // Increase timeout to 30 seconds

  };