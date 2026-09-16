import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../../components/Badge";
import { StatCard } from "../../components/StatCard";
import { formatDateTime } from "../../utils/download";
import type { Opportunity } from "../../types";

export function TeacherDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Admins see every opportunity across all supervisors; teachers see only their own.
    api
      .get("/opportunities", { params: { mine: isAdmin ? undefined : "true" } })
      .then((res) => setOpportunities(res.data.opportunities))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const totalApplicants = opportunities.reduce((sum, o) => sum + (o.applicantsCount ?? 0), 0);
  const active = opportunities.filter((o) => o.status === "PUBLISHED").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isAdmin ? "جميع الفرص التطوعية" : "لوحة تحكم مشرف التطوع"}</h1>
        <Link to="/teacher/opportunities/new" className="btn-primary">
          + إنشاء فرصة تطوعية
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="إجمالي الفرص" value={opportunities.length} />
        <StatCard label="فرص منشورة حالياً" value={active} />
        <StatCard label="إجمالي المتقدمين" value={totalApplicants} />
      </div>

      {loading ? (
        <p className="text-gray-500">جارِ التحميل...</p>
      ) : opportunities.length === 0 ? (
        <div className="card text-center text-gray-500">لا توجد فرص تطوعية بعد. ابدأ بإنشاء أول مبادرة.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {opportunities.map((o) => (
            <Link key={o.id} to={`/teacher/opportunities/${o.id}`} className="card block hover:shadow-md">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-bold">{o.title}</h3>
                <Badge status={o.status} />
              </div>
              <p className="mb-3 line-clamp-2 text-sm text-gray-500">{o.description}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className="rounded-full bg-gray-100 px-2 py-1">{o.field}</span>
                <span>{formatDateTime(o.startAt)}</span>
                <span>{o.hours} ساعة</span>
                <span>
                  {o.applicantsCount ?? 0} / {o.maxVolunteers} متطوع
                </span>
                {isAdmin && o.createdBy && <span>بواسطة: {o.createdBy.name}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
