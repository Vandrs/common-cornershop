import { DataSource, Repository } from 'typeorm';

import { Category, Customer, Order, OrderItem, Product, Stock } from '@domain/index';

import { CustomerRepositoryImpl } from './customer.repository.impl';

describe('CustomerRepositoryImpl (Integration)', () => {
  let dataSource: DataSource;
  let customerOrmRepository: Repository<Customer>;
  let repository: CustomerRepositoryImpl;

  const getRequiredEnv = (key: 'DB_HOST' | 'DB_PORT' | 'DB_USER' | 'DB_PASSWORD' | 'DB_NAME') => {
    const value = process.env[key];

    if (!value) {
      throw new Error(`Missing required env var for integration test: ${key}`);
    }

    return value;
  };

  beforeAll(async () => {
    const dbName = getRequiredEnv('DB_NAME');

    if (process.env.NODE_ENV !== 'test' || !/test/i.test(dbName)) {
      throw new Error(
        'Refusing to run CustomerRepositoryImpl integration tests with destructive DB config outside test environment',
      );
    }

    dataSource = new DataSource({
      type: 'postgres',
      host: getRequiredEnv('DB_HOST'),
      port: Number(getRequiredEnv('DB_PORT')),
      username: getRequiredEnv('DB_USER'),
      password: getRequiredEnv('DB_PASSWORD'),
      database: dbName,
      entities: [Category, Product, Stock, Order, OrderItem, Customer],
      synchronize: true,
      dropSchema: true,
      logging: false,
    });

    await dataSource.initialize();

    customerOrmRepository = dataSource.getRepository(Customer);
    repository = new CustomerRepositoryImpl(dataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE TABLE order_items, orders, customers, stocks, products, categories RESTART IDENTITY CASCADE',
    );
  });

  const createCustomer = async (overrides: Partial<Customer> = {}): Promise<Customer> => {
    return customerOrmRepository.save(
      customerOrmRepository.create({
        name: 'Jane Doe',
        email: `jane-${Date.now()}-${Math.floor(Math.random() * 10000)}@test.com`,
        phone: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
        ...overrides,
      }),
    );
  };

  describe('findById', () => {
    it('should return customer when found', async () => {
      const customer = await createCustomer({ name: 'Customer A' });

      const result = await repository.findById(customer.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(customer.id);
      expect(result?.name).toBe('Customer A');
    });

    it('should return null when customer does not exist', async () => {
      const result = await repository.findById('00000000-0000-0000-0000-000000000000');

      expect(result).toBeNull();
    });

    it('should exclude soft-deleted customers', async () => {
      const customer = await createCustomer();
      await customerOrmRepository.softDelete({ id: customer.id });

      const result = await repository.findById(customer.id);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should perform case-insensitive email lookup', async () => {
      const customer = await createCustomer({ email: 'Customer.Email@Test.COM' });

      const result = await repository.findByEmail('customer.email@test.com');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(customer.id);
    });

    it('should exclude soft-deleted customers', async () => {
      const customer = await createCustomer({ email: 'soft.delete@test.com' });
      await customerOrmRepository.softDelete({ id: customer.id });

      const result = await repository.findByEmail('soft.delete@test.com');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should persist and return the customer entity', async () => {
      const customer = new Customer();
      customer.name = 'Saved Customer';
      customer.email = 'saved-customer@test.com';
      customer.phone = '5511999999999';

      const saved = await repository.save(customer);

      expect(saved.id).toBeDefined();
      expect(saved.name).toBe('Saved Customer');

      const persisted = await customerOrmRepository.findOne({ where: { id: saved.id } });
      expect(persisted).not.toBeNull();
      expect(persisted?.email).toBe('saved-customer@test.com');
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt instead of hard-deleting', async () => {
      const customer = await createCustomer();

      await repository.softDelete(customer.id);

      const deleted = await customerOrmRepository.findOne({
        where: { id: customer.id },
        withDeleted: true,
      });

      expect(deleted).not.toBeNull();
      expect(deleted?.deletedAt).toBeInstanceOf(Date);

      const activeOnly = await repository.findById(customer.id);
      expect(activeOnly).toBeNull();
    });
  });
});
