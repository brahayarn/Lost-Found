import { z } from "zod";
import { ItemCategory } from "../types/item";

export const ItemLocationSchema = z.object({
  address: z.string().min(2).max(300),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const CreateItemSchema = z.object({
  title: z.string().min(2).max(140),
  description: z.string().min(5).max(5000),
  category: z.nativeEnum(ItemCategory),
  foundLocation: ItemLocationSchema,
  foundAt: z
    .string()
    .datetime({ message: "foundAt must be ISO 8601 datetime" }),
  reporterEmail: z.string().email().optional(),
  reporterPhone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Invalid phone")
    .optional(),
  photoUrls: z.array(z.string().url()).max(10).default([]),
  blurredPhotoUrls: z.array(z.string().url()).max(10).optional(),
  isValuable: z.boolean().optional(),
  serialNumber: z.string().max(100).optional(),
  hiddenMarks: z.string().max(500).optional(),
  color: z.string().max(60).optional(),
  brand: z.string().max(100).optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  internalNotes: z.string().max(2000).optional(),
});

export type CreateItemDto = z.infer<typeof CreateItemSchema>;

export const UpdateItemStatusSchema = z.object({
  status: z.enum([
    "NEW",
    "VERIFICATION",
    "PUBLISHED",
    "MATCHED",
    "CLAIMED",
    "RETURNED",
    "TO_DISPOSE",
    "ARCHIVED",
  ]),
});
export type UpdateItemStatusDto = z.infer<typeof UpdateItemStatusSchema>;
