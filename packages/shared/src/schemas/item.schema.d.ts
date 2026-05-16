import { z } from "zod";
import { ItemCategory } from "../types/item";
export declare const ItemLocationSchema: z.ZodObject<{
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
export declare const CreateItemSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    category: z.ZodNativeEnum<typeof ItemCategory>;
    foundLocation: z.ZodObject<{
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
    foundAt: z.ZodString;
    reporterEmail: z.ZodOptional<z.ZodString>;
    reporterPhone: z.ZodOptional<z.ZodString>;
    photoUrls: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    category: ItemCategory;
    foundLocation: {
        address: string;
        lat?: number | undefined;
        lng?: number | undefined;
    };
    foundAt: string;
    photoUrls: string[];
    reporterEmail?: string | undefined;
    reporterPhone?: string | undefined;
}, {
    title: string;
    description: string;
    category: ItemCategory;
    foundLocation: {
        address: string;
        lat?: number | undefined;
        lng?: number | undefined;
    };
    foundAt: string;
    reporterEmail?: string | undefined;
    reporterPhone?: string | undefined;
    photoUrls?: string[] | undefined;
}>;
export type CreateItemDto = z.infer<typeof CreateItemSchema>;
export declare const UpdateItemStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["NEW", "PUBLISHED", "MATCHED", "CLAIMED", "RETURNED", "ARCHIVED"]>;
}, "strip", z.ZodTypeAny, {
    status: "NEW" | "PUBLISHED" | "MATCHED" | "CLAIMED" | "RETURNED" | "ARCHIVED";
}, {
    status: "NEW" | "PUBLISHED" | "MATCHED" | "CLAIMED" | "RETURNED" | "ARCHIVED";
}>;
export type UpdateItemStatusDto = z.infer<typeof UpdateItemStatusSchema>;
