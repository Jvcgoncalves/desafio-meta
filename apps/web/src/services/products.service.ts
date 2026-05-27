import type {
  ProductDetailDto,
  ProductListItemDto
} from "@casecellshop/shared";

import { apiRequest } from "./http-client";

export async function listProducts(): Promise<ProductListItemDto[]> {
  const response = await apiRequest<ProductListItemDto[]>("/products");
  return response.data;
}

export async function getProduct(
  productId: string
): Promise<ProductDetailDto> {
  const response = await apiRequest<ProductDetailDto>(`/products/${productId}`);
  return response.data;
}
