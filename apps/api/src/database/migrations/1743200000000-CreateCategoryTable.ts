import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Creates the `categories` table with all constraints and indexes.
 *
 * Also enables the `uuid-ossp` PostgreSQL extension required by all
 * subsequent migrations that rely on `uuid_generate_v4()` as the default
 * value for primary key columns.
 */
export class CreateCategoryTable1743200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable the uuid-ossp extension required for uuid_generate_v4() default
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create table
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Unique index on LOWER(name) for case-insensitive uniqueness
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_CATEGORY_NAME_LOWER" ON "categories" (LOWER(name))`,
    );

    // Standard index supporting lookups by is_active flag
    await queryRunner.createIndex(
      'categories',
      new TableIndex({
        name: 'IDX_CATEGORY_IS_ACTIVE',
        columnNames: ['is_active'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('categories', 'IDX_CATEGORY_IS_ACTIVE');
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_CATEGORY_NAME_LOWER"`);

    // Drop table
    await queryRunner.dropTable('categories');
  }
}
