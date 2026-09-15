export const ROLES = ["TEACHER", "STUDENT", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const OPPORTUNITY_FIELDS = ["ثقافي", "بيئي", "اجتماعي", "تقني", "تنظيمي"] as const;
export type OpportunityField = (typeof OPPORTUNITY_FIELDS)[number];

export const OPPORTUNITY_STATUSES = ["DRAFT", "PUBLISHED", "CLOSED", "COMPLETED"] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const APPLICATION_STATUSES = ["PENDING", "ACCEPTED", "REJECTED"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "APPLICATION_ACCEPTED",
  "APPLICATION_REJECTED",
  "HOURS_APPROVED",
  "NEW_OPPORTUNITY",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
