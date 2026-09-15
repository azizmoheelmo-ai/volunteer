import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../../api/client";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import { formatDateTime } from "../../utils/download";
import type { Opportunity } from "../../types";

export function StudentOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyTarget, setApplyTarget] = useState<Opportunity | null>(null);
  const [skills, setSkills] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get("/opportunities/student-feed")
      .then((res) => setOpportunities(res.data.opportunities))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function submitApplication() {
    if (!applyTarget) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/opportunities/${applyTarget.id}/applications`, { skills: skills || undefined });
      setApplyTarget(null);
      setSkills("");
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">الفرص التطوعية المتاحة</h1>

      {loading ? (
        <p className="text-gray-500">جارِ التحميل...</p>
      ) : opportunities.length === 0 ? (
        <div className="card text-center text-gray-500">لا توجد فرص تطوعية متاحة لصفك حالياً</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {opportunities.map((o) => (
            <div key={o.id} className="card">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-bold">{o.title}</h3>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{o.field}</span>
              </div>
              <p className="mb-3 line-clamp-2 text-sm text-gray-500">{o.description}</p>
              <div className="mb-3 flex flex-wrap gap-3 text-xs text-gray-500">
                <span>{formatDateTime(o.startAt)}</span>
                <span>{o.hours} ساعة</span>
                <span>{o.spotsLeft} مقعد متبقي</span>
              </div>

              {o.myApplication ? (
                <Badge status={o.myApplication.status} />
              ) : (o.spotsLeft ?? 0) <= 0 ? (
                <span className="text-sm text-gray-400">اكتمل العدد</span>
              ) : (
                <button className="btn-primary" onClick={() => setApplyTarget(o)}>
                  تقديم سريع
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {applyTarget && (
        <Modal title={`التقديم على: ${applyTarget.title}`} onClose={() => setApplyTarget(null)}>
          <div className="space-y-4">
            <div>
              <label className="label">مهاراتك ذات الصلة (اختياري)</label>
              <input className="input" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="مثال: تصوير، تصميم" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full" disabled={submitting} onClick={submitApplication}>
              {submitting ? "جارِ الإرسال..." : "تأكيد التقديم"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
