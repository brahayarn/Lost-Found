import { z } from "zod";
import { ItemCategory } from "../types/item";
import { ItemLocationSchema } from "./item.schema";

export const CreateClaimSchema = z.object({
  category: z.nativeEnum(ItemCategory),
  description: z.string().min(5).max(5000),
  lostAt: z.string().datetime({ message: "lostAt must be ISO 8601 datetime" }),
  lostLocation: ItemLocationSchema,
  claimerEmail: z.string().email(),
  claimerPhone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/)
    .optional(),
});
export type CreateClaimDto = z.infer<typeof CreateClaimSchema>;
