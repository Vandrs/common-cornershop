import { createApp } from './app';
import { AppDataSource } from './database/data-source';

/**
 * Application entry point.
 *
 * Boot sequence:
 *  1. Initialise the TypeORM DataSource (validates DB connectivity and runs
 *     pending migrations when configured).
 *  2. Build and configure the Fastify application via `createApp()`.
 *  3. Bind to the port provided by the environment or fall back to 3000.
 *
 * Any fatal startup error is caught and logged before exiting with a non-zero
 * code so the process manager (Docker, systemd, k8s) can detect the failure
 * and restart or alert accordingly.
 */
async function bootstrap(): Promise<void> {
  try {
    await AppDataSource.initialize();

    const app = await createApp();
    const port = parseInt(process.env.PORT ?? '3000', 10);
    const host = process.env.HOST ?? '0.0.0.0';

    await app.listen({ port, host });
  } catch (error) {
    // Log only the message to avoid accidentally exposing database connection
    // strings, credentials or full stack traces in centralised log pipelines.
    const message = error instanceof Error ? error.message : String(error);
    console.error('Fatal error during application bootstrap:', message);
    process.exit(1);
  }
}

bootstrap();
