export declare enum ItemStatus {
    NEW = "NEW",
    PUBLISHED = "PUBLISHED",
    MATCHED = "MATCHED",
    CLAIMED = "CLAIMED",
    RETURNED = "RETURNED",
    TO_DISPOSE = "TO_DISPOSE",
    ARCHIVED = "ARCHIVED"
}
export declare enum ItemCategory {
    ELECTRONICS = "ELECTRONICS",
    DOCUMENTS = "DOCUMENTS",
    KEYS = "KEYS",
    BAG = "BAG",
    CLOTHING = "CLOTHING",
    JEWELRY = "JEWELRY",
    OTHER = "OTHER"
}
export interface IItemLocation {
    address: string;
    lat?: number;
    lng?: number;
}
export interface IItem {
    _id: string;
    itemNumber: string;
    trackingCode: string;
    title: string;
    description: string;
    category: ItemCategory;
    status: ItemStatus;
    foundLocation: IItemLocation;
    foundAt: string;
    reporterEmail?: string;
    reporterPhone?: string;
    photoUrls: string[];
    createdAt: string;
    updatedAt: string;
}
export type ItemPublic = Omit<IItem, "reporterEmail" | "reporterPhone">;
