import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Adds required customer reference to the `orders` table.
 */
export class AddCustomerIdToOrders1743200060000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const legacyCustomerId = '00000000-0000-0000-0000-000000000001';

    await queryRunner.query(
      `
        INSERT INTO "customers" ("id", "name", "email", "phone", "created_at", "updated_at")
        VALUES ($1, 'Cliente legado', 'legacy.customer@cornershop.local', '0000000000000', now(), now())
        ON CONFLICT ("id") DO NOTHING
      `,
      [legacyCustomerId],
    );

    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'customer_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.query(`UPDATE "orders" SET "customer_id" = $1 WHERE "customer_id" IS NULL`, [
      legacyCustomerId,
    ]);

    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "customer_id" SET NOT NULL`);

    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        name: 'FK_ORDER_CUSTOMER',
        columnNames: ['customer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customers',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_ORDER_CUSTOMER',
        columnNames: ['customer_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('orders', 'IDX_ORDER_CUSTOMER');
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_ORDER_CUSTOMER"`);
    await queryRunner.dropColumn('orders', 'customer_id');

    await queryRunner.query(
      `DELETE FROM "customers" WHERE "id" = '00000000-0000-0000-0000-000000000001'`,
    );
  }
}
