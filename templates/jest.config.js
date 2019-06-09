
module.exports = {
  cacheDirectory: '<rootDir>/.tmp/jest',
  coverageDirectory: './.tmp/coverage',
  moduleNameMapper: {
    '^.+\\.(css|scss|cssmodule)$': 'identity-obj-proxy',
  },
  modulePaths: ['<rootDir>'],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  globals: {
    NODE_ENV: 'test',
  },
  verbose: true,
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(js|jsx)$',
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/mocks/.*', '/__tests__/setup.js'],
  transformIgnorePatterns: ['.*(node_modules).*$'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  setupFiles: ['<rootDir>/src/__tests__/setup.js'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
};
