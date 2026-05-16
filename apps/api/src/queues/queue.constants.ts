export const QUEUE_MATCHING = "matching";
export const QUEUE_NOTIFICATIONS = "notifications";

export type MatchingJobName = "match-from-item" | "match-from-claim";
export interface MatchFromItemJob {
  itemId: string;
}
export interface MatchFromClaimJob {
  claimId: string;
}

export type NotificationJobName =
  | "match-found"
  | "retention-warning"
  | "retention-expired"
  | "subscription-match";

export interface SubscriptionMatchJob {
  to: string;
  itemId: string;
  itemNumber: string;
  itemTitle: string;
  category: string;
}

export interface MatchFoundJob {
  to: string;
  claimId: string;
  itemId: string;
  itemNumber: string;
  score: number;
}

export interface RetentionWarningJob {
  itemId: string;
  itemNumber: string;
  daysLeft: number;
}

export interface RetentionExpiredJob {
  itemId: string;
  itemNumber: string;
}
