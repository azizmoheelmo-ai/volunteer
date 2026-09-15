import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { StatCard } from "../../components/StatCard";
import { downloadFile, formatDateTime } from "../../utils/download";
import type { Wallet } from "../../types";

export function StudentWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    api.get("/students/me/wallet").then((res) => setWallet(res.data));
  }, []);

  if (!wallet) return <div className="mx-auto max-w-4xl px-4 py-8 text-gray-500">جارِ التحميل...</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">المحفظة التطوعية الرقمية</h1>
        <button
          className="btn-secondary"
          onClick={() => downloadFile("/reports/students/me/certificate.pdf", "volunteering-certificate.pdf")}
        >
          تحميل شهادة السجل
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="إجمالي الساعات المعتمدة" value={`${wallet.totalHours} ساعة`} />
        <StatCard label="عدد المبادرات المكتملة" value={wallet.initiativesCount} />
      </div>

      <div className="card">
        <h3 className="mb-3 font-semibold">سجل المبادرات</h3>
        {wallet.history.length === 0 ? (
          <p className="text-gray-400">لا يوجد سجل تطوعي بعد</p>
        ) : (
          <ul className="divide-y">
            {wallet.history.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{h.opportunity.title}</p>
                  <p className="text-xs text-gray-500">
                    {h.opportunity.field} — اعتمدت بتاريخ {formatDateTime(h.approvedAt)}
                  </p>
                </div>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700">
                  {h.hours} ساعة
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
