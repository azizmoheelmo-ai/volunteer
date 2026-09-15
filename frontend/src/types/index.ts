export type Role = "TEACHER" | "STUDENT" | "ADMIN";

export function homePathForRole(role: Role): string {
  if (role === "STUDENT") return "/student";
  if (role === "ADMIN") return "/admin";
  return "/teacher";
}

export type OpportunityField = "ثقافي" | "بيئي" | "اجتماعي" | "تقني" | "تنظيمي";
export const OPPORTUNITY_FIELDS: OpportunityField[] = ["ثقافي", "بيئي", "اجتماعي", "تقني", "تنظيمي"];

export type OpportunityStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "COMPLETED";
export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentNumber: string | null;
  grade: string | null;
  phone: string | null;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  field: OpportunityField;
  startAt: string;
  endAt: string;
  hours: number;
  maxVolunteers: number;
  targetGrades: string[];
  status: OpportunityStatus;
  uniqueSlug: string;
  shareUrl: string;
  qrCodeDataUrl?: string;
  applicantsCount?: number;
  createdBy?: { id: string; name: string };
  myApplication?: { id: string; status: ApplicationStatus } | null;
  spotsLeft?: number;
}

export interface Application {
  id: string;
  opportunityId: string;
  studentId: string;
  skills: string | null;
  status: ApplicationStatus;
  appliedAt: string;
  student?: { id: string; name: string; studentNumber: string | null; grade: string | null; phone: string | null };
  opportunity?: Opportunity;
  attendance?: { id: string; present: boolean; markedAt: string | null } | null;
}

export interface AttendanceRow {
  id: string;
  opportunityId: string;
  studentId: string;
  applicationId: string;
  present: boolean;
  markedAt: string | null;
  student: { id: string; name: string; studentNumber: string | null; grade: string | null };
}

export interface WalletHistoryItem {
  id: string;
  hours: number;
  approvedAt: string;
  opportunity: { id: string; title: string; field: string; startAt: string; endAt: string };
}

export interface Wallet {
  student: { id: string; name: string; studentNumber: string | null; grade: string | null };
  totalHours: number;
  initiativesCount: number;
  history: WalletHistoryItem[];
}
