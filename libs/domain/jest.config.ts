import * as path from 'path';

export default {
  displayName: 'domain',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/domain',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.spec.ts',
    '!src/index.ts',
    // Entities are TypeORM POJOs — their decorator callbacks (e.g. `() => Category`)
    // are counted as uncalled functions by Jest but are never invoked directly in unit tests.
    // They are exercised through integration tests (repository layer).
    '!src/entities/*.entity.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Absolute path is required because Jest resolves coverageThreshold keys via
    // `path.resolve()` from the process CWD (the NX workspace root when run via
    // `yarn test:coverage`), NOT from the Jest rootDir of this library.
    [path.join(__dirname, 'src/**/*.service.ts')]: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
