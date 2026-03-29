import 'reflect-metadata';

import { AppDataSource } from '../data-source';
import { runSeeds } from './index';

/**
 * Standalone entry point for running database seeds.
 *
 * Usage (via NX target or directly with ts-node):
 *   npx ts-node -r tsconfig-paths/register apps/api/src/database/seeds/run-seeds.ts
 *
 * The process exits with code 0 on success and code 1 on any error,
 * making it safe to use in CI pipelines and npm scripts.
 */
AppDataSource.initialize()
  .then(() => {
    console.log('[Seeds] Database connection established.');
    return runSeeds(AppDataSource);
  })
  .then(() => {
    console.log('[Seeds] Done. Closing connection.');
    return AppDataSource.destroy();
  })
  .then(() => {
    process.exit(0);
  })
  .catch((err: unknown) => {
    console.error('[Seeds] Fatal error:', err);
    process.exit(1);
  });
