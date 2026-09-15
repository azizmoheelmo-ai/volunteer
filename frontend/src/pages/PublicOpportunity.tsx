import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatDateTime } from "../utils/download";

interface PublicOpportunity {
  id: string;
  title: string;
  description: string;
  field: string;
  startAt: string;
  endAt: string;
  hours: number;
  spotsLeft: number;
  organizer: string;
}

export function PublicOpportunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [opportunity, setOpportunity] = useState<PublicOpportunity | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/public/opportunities/${slug}`)
      .then((res) => setOpportunity(res.data.opportunity))
      .catch((err) => setError(apiErrorMessage(err)));
  }, [slug]);

  if (error) return <div className="mx-auto max-w-lg px-4 py-16 text-center text-red-600">{error}</div>;
  if (!opportunity) return <div className="mx-auto max-w-lg px-4 py-16 text-center text-gray-500">جارِ التحميل...</div>;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="card">
        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{opportunity.field}</span>
        <h1 className="mt-2 text-xl font-bold">{opportunity.title}</h1>
        <p className="mt-2 text-gray-600">{opportunity.description}</p>

        <div className="mt-4 space-y-1 text-sm text-gray-500">
          <p>المنظّم: {opportunity.organizer}</p>
          <p>
            {formatDateTime(opportunity.startAt)} — {formatDateTime(opportunity.endAt)}
          </p>
          <p>{opportunity.hours} ساعة تطوعية</p>
          <p>{opportunity.spotsLeft} مقعد متبقٍ</p>
        </div>

        <div className="mt-6">
          {user?.role === "STUDENT" ? (
            <Link to="/student" className="btn-primary w-full">
              الذهاب للتقديم من لوحتي
            </Link>
          ) : (
            <Link to="/login" className="btn-primary w-full">
              سجّل الدخول كطالب للتقديم
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
