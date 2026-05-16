import { ItemCategory, IItemLocation } from "./item";

export enum ClaimStatus {
  NEW = "NEW",
  PROCESSING = "PROCESSING",
  MATCHED = "MATCHED",
  READY_FOR_HANDOVER = "READY_FOR_HANDOVER",
  CLOSED = "CLOSED",
  REJECTED = "REJECTED",
}

export interface IClaim {
  _id: string;
  claimNumber: string;
  status: ClaimStatus;
  category: ItemCategory;
  description: string;
  lostAt: string;
  lostLocation: IItemLocation;
  claimerEmail: string;
  claimerPhone?: string;
  identityConfirmed?: boolean;
  idDocumentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export enum MatchProposalStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  REJECTED = "REJECTED",
}

export interface IMatchProposal {
  _id: string;
  itemId: string;
  claimId: string;
  score: number;
  status: MatchProposalStatus;
  reasons: string[];
  createdAt: string;
  updatedAt: string;
}
