import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'tsyringe';

import {
  GetProductUseCase,
  GetStockUseCase,
  ListProductsUseCase,
  Product,
  Stock,
} from '@domain/index';

import { listProductsQuerySchema, productParamsSchema } from '../http/schemas';

interface ProductListItemResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductResponse extends ProductListItemResponse {
  stock: {
    id: string;
    productId: string;
    quantity: number;
    minimumQuantity: number;
    lastUpdatedAt: string;
  };
}

/**
 * Controller responsible for product read endpoints.
 */
@injectable()
export class ProductController {
  constructor(
    @inject('ListProductsUseCase')
    private readonly listProductsUseCase: ListProductsUseCase,
    @inject('GetProductUseCase')
    private readonly getProductUseCase: GetProductUseCase,
    @inject('GetStockUseCase')
    private readonly getStockUseCase: GetStockUseCase,
  ) {}

  /**
   * GET /api/products
   */
  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = listProductsQuerySchema.parse(request.query);
    const result = await this.listProductsUseCase.execute(query);

    reply.status(200).send({
      data: result.data.map((product) => this.toListItemResponse(product)),
      meta: result.meta,
    });
  }

  /**
   * GET /api/products/:id
   */
  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = productParamsSchema.parse(request.params);
    const product = await this.getProductUseCase.execute(id);
    const stock = await this.getStockUseCase.execute(id);

    reply.status(200).send(this.toGetResponse(product, stock));
  }

  private toListItemResponse(product: Product): ProductListItemResponse {
    return {
      id: product.id,
      name: product.name,
      description: product.description ?? null,
      price: Number(product.price),
      categoryId: product.categoryId,
      category: {
        id: product.category.id,
        name: product.category.name,
      },
      isActive: product.isActive,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  private toGetResponse(product: Product, stock: Stock): ProductResponse {
    return {
      ...this.toListItemResponse(product),
      stock: {
        id: stock.id,
        productId: stock.productId,
        quantity: stock.quantity,
        minimumQuantity: stock.minimumQuantity,
        lastUpdatedAt: stock.lastUpdatedAt.toISOString(),
      },
    };
  }
}
