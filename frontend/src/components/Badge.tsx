const STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-brand-100 text-brand-700",
  REJECTED: "bg-red-100 text-red-700",
  DRAFT: "bg-gray-100 text-gray-600",
  PUBLISHED: "bg-brand-100 text-brand-700",
  CLOSED: "bg-gray-200 text-gray-600",
  COMPLETED: "bg-blue-100 text-blue-700",
};

const LABELS: Record<string, string> = {
  PENDING: "قيد المراجعة",
  ACCEPTED: "مقبول",
  REJECTED: "مرفوض",
  DRAFT: "مسودة",
  PUBLISHED: "منشورة",
  CLOSED: "مغلقة",
  COMPLETED: "منتهية",
};

export function Badge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status] ?? "bg-gray-100 text-gray-600"}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
