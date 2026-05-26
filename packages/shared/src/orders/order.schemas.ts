import { z } from "zod";

export const createOrderItemSchema = z
  .object({
    productId: z.uuid(),
    quantity: z.number().int().positive()
  })
  .strict();

export const createOrderRequestSchema = z
  .object({
    items: z.array(createOrderItemSchema).min(1)
  })
  .strict();
