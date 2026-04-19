import { injectable } from 'tsyringe';
import { DataSource, IsNull, Repository } from 'typeorm';

import { CustomerAlreadyExistsException } from '@domain/errors/customer-already-exists.error';
import { Customer } from '@domain/entities/customer.entity';
import { ICustomerRepository } from '@domain/repositories/customer.repository';

import { AppDataSource } from '../database/data-source';

/**
 * TypeORM implementation of ICustomerRepository.
 */
@injectable()
export class CustomerRepositoryImpl implements ICustomerRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repository(): Repository<Customer> {
    return this.dataSource.getRepository(Customer);
  }

  async findById(id: string): Promise<Customer | null> {
    return this.repository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.repository
      .createQueryBuilder('customer')
      .where('LOWER(customer.email) = LOWER(:email)', { email })
      .andWhere('customer.deletedAt IS NULL')
      .getOne();
  }

  async save(customer: Customer): Promise<Customer> {
    try {
      return await this.repository.save(customer);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === '23505'
      ) {
        throw new CustomerAlreadyExistsException();
      }

      throw error;
    }
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
