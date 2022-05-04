// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
	clearMocks: true,
	collectCoverageFrom: ['src/**/*.[tj]s'],
	coverageDirectory: 'coverage',
	coveragePathIgnorePatterns: [
	  "/node_modules/",
	  "/dist/",
	],
  preset: 'ts-jest',
	roots: [
	  'src'
	],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['.d.ts', '.js', '__mocks__', 'mockData'],
  setupFiles: ['<rootDir>/.jest/setEnvVars.js']
}
