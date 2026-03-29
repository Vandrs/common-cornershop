import { DataSource } from 'typeorm';

import { Category } from '@domain/entities/category.entity';
import { Product } from '@domain/entities/product.entity';
import { Stock } from '@domain/entities/stock.entity';
import { Order } from '@domain/entities/order.entity';
import { OrderItem } from '@domain/entities/order-item.entity';

import { getDatabaseConfig } from '../config/database.config';

/**
 * All domain entities that TypeORM must be aware of.
 *
 * Entities are referenced by explicit import (not glob strings) because the
 * project runs inside an NX monorepo where glob paths are not reliably
 * resolved by the TypeORM CLI or the compiled output.
 */
const ENTITIES = [Category, Product, Stock, Order, OrderItem];

const dbConfig = getDatabaseConfig();

/**
 * Singleton TypeORM DataSource for the application.
 *
 * Configuration is driven entirely by environment variables validated through
 * {@link getDatabaseConfig}. The call is made once at module load time,
 * ensuring the process fails fast with a clear error message if any required
 * variable is missing or invalid.
 *
 * Design decisions:
 * - `synchronize: false` — schema changes are always managed through migrations
 *   (see docs/database.md). Enabling synchronize in any environment risks
 *   accidental data loss.
 * - `logging` is enabled only in development to avoid performance overhead and
 *   to keep production logs clean.
 * - SSL support is opt-in via the `DB_SSL` environment variable, allowing
 *   local development without TLS while production deployments can enable it.
 *   Certificate validation is enforced by default (`DB_SSL_REJECT_UNAUTHORIZED=true`)
 *   to prevent MITM attacks; set to "false" only in environments where a
 *   trusted CA bundle cannot be provided (e.g. some managed cloud databases).
 * - Entities use explicit class imports (not globs) for NX monorepo
 *   compatibility and type-safe incremental builds.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: ENTITIES,
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  ssl: dbConfig.ssl ? { rejectUnauthorized: dbConfig.sslRejectUnauthorized } : false,
});
