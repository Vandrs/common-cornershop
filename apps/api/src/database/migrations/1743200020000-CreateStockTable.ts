import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Creates the `stocks` table with its foreign key to `products` and
 * check constraints enforcing non-negative quantity values.
 */
export class CreateStockTable1743200020000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create table
    await queryRunner.createTable(
      new Table({
        name: 'stocks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'quantity',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'minimum_quantity',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'last_updated_at',
            type: 'timestamp',
            isNullable: false,
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

    // Foreign key → products
    await queryRunner.createForeignKey(
      'stocks',
      new TableForeignKey({
        name: 'FK_STOCK_PRODUCT',
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // Index supporting FK lookup on product_id
    await queryRunner.createIndex(
      'stocks',
      new TableIndex({
        name: 'IDX_STOCK_PRODUCT',
        columnNames: ['product_id'],
      }),
    );

    // Check constraints
    await queryRunner.query(
      `ALTER TABLE "stocks" ADD CONSTRAINT "CHK_STOCK_QUANTITY_NON_NEGATIVE" CHECK (quantity >= 0)`,
    );

    await queryRunner.query(
      `ALTER TABLE "stocks" ADD CONSTRAINT "CHK_STOCK_MIN_QTY_NON_NEGATIVE" CHECK (minimum_quantity >= 0)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop check constraints
    await queryRunner.query(
      `ALTER TABLE "stocks" DROP CONSTRAINT "CHK_STOCK_MIN_QTY_NON_NEGATIVE"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stocks" DROP CONSTRAINT "CHK_STOCK_QUANTITY_NON_NEGATIVE"`,
    );

    // Drop index
    await queryRunner.dropIndex('stocks', 'IDX_STOCK_PRODUCT');

    // Drop foreign key by name
    await queryRunner.query(`ALTER TABLE "stocks" DROP CONSTRAINT "FK_STOCK_PRODUCT"`);

    // Drop table
    await queryRunner.dropTable('stocks');
  }
}
