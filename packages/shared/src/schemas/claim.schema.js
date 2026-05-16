"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateClaimSchema = void 0;
const zod_1 = require("zod");
const item_1 = require("../types/item");
const item_schema_1 = require("./item.schema");
exports.CreateClaimSchema = zod_1.z.object({
    category: zod_1.z.nativeEnum(item_1.ItemCategory),
    description: zod_1.z.string().min(5).max(5000),
    lostAt: zod_1.z.string().datetime({ message: "lostAt must be ISO 8601 datetime" }),
    lostLocation: item_schema_1.ItemLocationSchema,
    claimerEmail: zod_1.z.string().email(),
    claimerPhone: zod_1.z
        .string()
        .regex(/^\+?[0-9\s\-()]{7,20}$/)
        .optional(),
});
//# sourceMappingURL=claim.schema.js.map