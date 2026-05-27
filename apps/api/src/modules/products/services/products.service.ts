import {
  APP_ERROR_CODES,
  type ProductDetailDto,
  type ProductListItemDto
} from "@casecellshop/shared";

import { AppError } from "../../../common/errors/app-error.js";
import type { ProductRecord } from "../models/product.types.js";

export interface ProductsRepositoryPort {
  list: () => Promise<ProductRecord[]>;
  findById: (productId: string) => Promise<ProductRecord | null>;
}

function toProductDto(product: ProductRecord): ProductListItemDto {
  return {
    id: product.id,
    name: product.name,
    model: product.model,
    availableStock: product.availableStock,
    priceCents: product.priceCents
  };
}

export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepositoryPort) {}

  async listProducts(): Promise<ProductListItemDto[]> {
    const products = await this.productsRepository.list();

    return products.map(toProductDto);
  }

  async getProduct(productId: string): Promise<ProductDetailDto> {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new AppError({
        code: APP_ERROR_CODES.PRODUCT_NOT_FOUND,
        message: "Product not found.",
        statusCode: 404
      });
    }

    return toProductDto(product);
  }
}
