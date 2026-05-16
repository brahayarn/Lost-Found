"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateItemStatusSchema = exports.CreateItemSchema = exports.ItemLocationSchema = void 0;
const zod_1 = require("zod");
const item_1 = require("../types/item");
exports.ItemLocationSchema = zod_1.z.object({
    address: zod_1.z.string().min(2).max(300),
    lat: zod_1.z.number().min(-90).max(90).optional(),
    lng: zod_1.z.number().min(-180).max(180).optional(),
});
exports.CreateItemSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).max(140),
    description: zod_1.z.string().min(5).max(5000),
    category: zod_1.z.nativeEnum(item_1.ItemCategory),
    foundLocation: exports.ItemLocationSchema,
    foundAt: zod_1.z
        .string()
        .datetime({ message: "foundAt must be ISO 8601 datetime" }),
    reporterEmail: zod_1.z.string().email().optional(),
    reporterPhone: zod_1.z
        .string()
        .regex(/^\+?[0-9\s\-()]{7,20}$/, "Invalid phone")
        .optional(),
    photoUrls: zod_1.z.array(zod_1.z.string().url()).max(10).default([]),
});
exports.UpdateItemStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([
        "NEW",
        "PUBLISHED",
        "MATCHED",
        "CLAIMED",
        "RETURNED",
        "ARCHIVED",
    ]),
});
//# sourceMappingURL=item.schema.js.map