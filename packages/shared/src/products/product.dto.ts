export interface ProductListItemDto {
  id: string;
  name: string;
  model: string;
  availableStock: number;
  priceCents: number;
}

export interface ProductDetailDto extends ProductListItemDto {}
