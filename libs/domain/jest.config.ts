export default {
  displayName: 'domain',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/domain',
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.spec.ts', '!src/index.ts'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/**/*.service.ts': {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
