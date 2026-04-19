import { injectable } from 'tsyringe';
import { DataSource, IsNull, Repository } from 'typeorm';

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
    return this.repository.save(customer);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
