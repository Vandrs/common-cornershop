interface OrderItemPayloadInput {
  productId: string;
  quantity?: number;
}

export interface OrderItemPayload {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  items: OrderItemPayload[];
}

/**
 * Builder for order payloads used in E2E requests.
 */
export class OrderFactory {
  static buildCreatePayload(items: OrderItemPayloadInput[]): CreateOrderPayload {
    return {
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity ?? 1,
      })),
    };
  }
}
