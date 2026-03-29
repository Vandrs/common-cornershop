import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Creates the `order_items` table with foreign keys to both `orders` and
 * `products`, the required indexes, and check constraints enforcing
 * positive quantity and unit price values.
 */
export class CreateOrderItemTable1743200040000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create table
    await queryRunner.createTable(
      new Table({
        name: 'order_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'order_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'unit_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 10,
            scale: 2,
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

    // Foreign key → orders
    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        name: 'FK_ORDER_ITEM_ORDER',
        columnNames: ['order_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'orders',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // Foreign key → products
    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        name: 'FK_ORDER_ITEM_PRODUCT',
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // Index supporting FK lookup on order_id
    await queryRunner.createIndex(
      'order_items',
      new TableIndex({
        name: 'IDX_ORDER_ITEM_ORDER',
        columnNames: ['order_id'],
      }),
    );

    // Index supporting FK lookup on product_id
    await queryRunner.createIndex(
      'order_items',
      new TableIndex({
        name: 'IDX_ORDER_ITEM_PRODUCT',
        columnNames: ['product_id'],
      }),
    );

    // Check constraints
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "CHK_ORDER_ITEM_QUANTITY_POSITIVE" CHECK (quantity > 0)`,
    );

    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "CHK_ORDER_ITEM_UNIT_PRICE_POSITIVE" CHECK (unit_price > 0)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop check constraints
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "CHK_ORDER_ITEM_UNIT_PRICE_POSITIVE"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "CHK_ORDER_ITEM_QUANTITY_POSITIVE"`,
    );

    // Drop indexes
    await queryRunner.dropIndex('order_items', 'IDX_ORDER_ITEM_PRODUCT');
    await queryRunner.dropIndex('order_items', 'IDX_ORDER_ITEM_ORDER');

    // Drop foreign keys by name
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_ORDER_ITEM_PRODUCT"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_ORDER_ITEM_ORDER"`);

    // Drop table
    await queryRunner.dropTable('order_items');
  }
}
