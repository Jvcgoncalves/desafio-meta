import { z } from "zod";

export const productListItemSchema = z
  .object({
    id: z.uuid(),
    name: z.string().min(1),
    model: z.string().min(1),
    availableStock: z.number().int().nonnegative(),
    priceCents: z.number().int().nonnegative()
  })
  .strict();

export const productDetailSchema = productListItemSchema;
