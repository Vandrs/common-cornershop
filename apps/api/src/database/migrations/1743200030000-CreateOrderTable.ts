import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Creates the `orders` table.
 *
 * Also creates the `order_status_enum` PostgreSQL enum type used by the
 * `status` column. The enum is dropped in the `down` method after the
 * table is removed.
 */
export class CreateOrderTable1743200030000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create PostgreSQL enum type for order status
    await queryRunner.query(
      `CREATE TYPE "order_status_enum" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED')`,
    );

    // Create table
    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'order_number',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'status',
            type: 'order_status_enum',
            isNullable: false,
            default: `'PENDING'`,
          },
          {
            name: 'total_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
            default: 0,
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

    // Index on status for filtering orders by lifecycle state
    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_ORDER_STATUS',
        columnNames: ['status'],
      }),
    );

    // Index on order_number (unique constraint already covers this but an
    // explicit named index is required by the domain model spec)
    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_ORDER_NUMBER',
        columnNames: ['order_number'],
        isUnique: true,
      }),
    );

    // Check constraint: total_amount must be non-negative
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "CHK_ORDER_TOTAL_AMOUNT_NON_NEGATIVE" CHECK (total_amount >= 0)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop check constraint
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "CHK_ORDER_TOTAL_AMOUNT_NON_NEGATIVE"`,
    );

    // Drop indexes
    await queryRunner.dropIndex('orders', 'IDX_ORDER_NUMBER');
    await queryRunner.dropIndex('orders', 'IDX_ORDER_STATUS');

    // Drop table
    await queryRunner.dropTable('orders');

    // Drop PostgreSQL enum type
    await queryRunner.query(`DROP TYPE "order_status_enum"`);
  }
}
