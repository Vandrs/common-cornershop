const { workspaceRoot } = require('@nx/devkit');

module.exports = {
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  resolver: '@nx/jest/plugins/resolver',
  moduleNameMapper: {
    '^@domain/(.*)$': `${workspaceRoot}/libs/domain/src/$1`,
    '^@shared/(.*)$': `${workspaceRoot}/libs/shared/src/$1`,
  },
};
