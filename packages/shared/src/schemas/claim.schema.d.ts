import { z } from "zod";
import { ItemCategory } from "../types/item";
export declare const CreateClaimSchema: z.ZodObject<{
    category: z.ZodNativeEnum<typeof ItemCategory>;
    description: z.ZodString;
    lostAt: z.ZodString;
    lostLocation: z.ZodObject<{
        address: z.ZodString;
        lat: z.ZodOptional<z.ZodNumber>;
        lng: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        address: string;
        lat?: number | undefined;
        lng?: number | undefined;
    }, {
        address: string;
        lat?: number | undefined;
        lng?: number | undefined;
    }>;
    claimerEmail: z.ZodString;
    claimerPhone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description: string;
    category: ItemCategory;
    lostAt: string;
    lostLocation: {
        address: string;
        lat?: number | undefined;
        lng?: number | undefined;
    };
    claimerEmail: string;
    claimerPhone?: string | undefined;
}, {
    description: string;
    category: ItemCategory;
    lostAt: string;
    lostLocation: {
        address: string;
        lat?: number | undefined;
        lng?: number | undefined;
    };
    claimerEmail: string;
    claimerPhone?: string | undefined;
}>;
export type CreateClaimDto = z.infer<typeof CreateClaimSchema>;
