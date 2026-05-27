import type {
  ApiSuccessResponse,
  ProductDetailDto,
  ProductListItemDto
} from "@casecellshop/shared";
import type { FastifyReply, FastifyRequest } from "fastify";

export interface ProductsServicePort {
  listProducts: () => Promise<ProductListItemDto[]>;
  getProduct: (productId: string) => Promise<ProductDetailDto>;
}

interface ProductParams {
  productId: string;
}

export class ProductsController {
  constructor(private readonly productsService: ProductsServicePort) {}

  list = async (
    _request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const products = await this.productsService.listProducts();
    const response: ApiSuccessResponse<ProductListItemDto[]> = {
      success: true,
      message: "Products loaded successfully.",
      data: products
    };

    reply.status(200).send(response);
  };

  detail = async (
    request: FastifyRequest<{ Params: ProductParams }>,
    reply: FastifyReply
  ): Promise<void> => {
    const product = await this.productsService.getProduct(
      request.params.productId
    );
    const response: ApiSuccessResponse<ProductDetailDto> = {
      success: true,
      message: "Product loaded successfully.",
      data: product
    };

    reply.status(200).send(response);
  };
}
