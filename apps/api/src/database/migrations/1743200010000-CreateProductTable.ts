import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Creates the `products` table with its foreign key to `categories`,
 * composite unique index, and check constraint enforcing a positive price.
 */
export class CreateProductTable1743200010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create table
    await queryRunner.createTable(
      new Table({
        name: 'products',
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
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'category_id',
            type: 'uuid',
            isNullable: false,
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

    // Foreign key → categories
    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        name: 'FK_PRODUCT_CATEGORY',
        columnNames: ['category_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // Index supporting FK lookup on category_id
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_PRODUCT_CATEGORY',
        columnNames: ['category_id'],
      }),
    );

    // Composite unique index: (name, category_id)
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_PRODUCT_NAME_CATEGORY',
        columnNames: ['name', 'category_id'],
        isUnique: true,
      }),
    );

    // Check constraint: price must be positive
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "CHK_PRODUCT_PRICE_POSITIVE" CHECK (price > 0)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop check constraint
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "CHK_PRODUCT_PRICE_POSITIVE"`);

    // Drop indexes
    await queryRunner.dropIndex('products', 'IDX_PRODUCT_NAME_CATEGORY');
    await queryRunner.dropIndex('products', 'IDX_PRODUCT_CATEGORY');

    // Drop foreign key by name
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_PRODUCT_CATEGORY"`);

    // Drop table
    await queryRunner.dropTable('products');
  }
}
