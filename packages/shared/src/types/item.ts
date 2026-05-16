export enum ItemStatus {
  NEW = "NEW",
  VERIFICATION = "VERIFICATION",
  PUBLISHED = "PUBLISHED",
  MATCHED = "MATCHED",
  CLAIMED = "CLAIMED",
  RETURNED = "RETURNED",
  TO_DISPOSE = "TO_DISPOSE",
  ARCHIVED = "ARCHIVED",
}

export enum ItemCategory {
  ELECTRONICS = "ELECTRONICS",
  DOCUMENTS = "DOCUMENTS",
  KEYS = "KEYS",
  BAG = "BAG",
  CLOTHING = "CLOTHING",
  JEWELRY = "JEWELRY",
  OTHER = "OTHER",
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
  blurredPhotoUrls?: string[];
  color?: string;
  brand?: string;
  tags?: string[];
  internalNotes?: string;
  isValuable?: boolean;
  serialNumber?: string;
  hiddenMarks?: string;
  retentionDate?: string;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ItemPublic = Omit<
  IItem,
  "reporterEmail" | "reporterPhone" | "internalNotes" | "hiddenMarks" | "serialNumber"
>;
