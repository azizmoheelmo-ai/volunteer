import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import { Badge } from "../../components/Badge";
import { downloadFile, formatDateTime } from "../../utils/download";
import type { Application, AttendanceRow, Opportunity } from "../../types";

export function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [gradeFilter, setGradeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [skillsFilter, setSkillsFilter] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadOpportunity = useCallback(async () => {
    const res = await api.get(`/opportunities/${id}`);
    setOpportunity(res.data.opportunity);
  }, [id]);

  const loadApplications = useCallback(async () => {
    const res = await api.get(`/opportunities/${id}/applications`, {
      params: { grade: gradeFilter || undefined, status: statusFilter || undefined, skills: skillsFilter || undefined },
    });
    setApplications(res.data.applications);
  }, [id, gradeFilter, statusFilter, skillsFilter]);

  const loadAttendance = useCallback(async () => {
    const res = await api.get(`/opportunities/${id}/attendance`);
    setAttendance(res.data.attendance);
  }, [id]);

  useEffect(() => {
    loadOpportunity();
    loadAttendance();
  }, [loadOpportunity, loadAttendance]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  async function decide(applicationId: string, status: "ACCEPTED" | "REJECTED") {
    try {
      await api.patch(`/applications/${applicationId}/decision`, { status });
      await Promise.all([loadApplications(), loadAttendance(), loadOpportunity()]);
    } catch (err) {
      setMessage(apiErrorMessage(err));
    }
  }

  async function toggleAttendance(row: AttendanceRow) {
    try {
      await api.patch(`/opportunities/${id}/attendance/${row.id}`, { present: !row.present });
      await loadAttendance();
    } catch (err) {
      setMessage(apiErrorMessage(err));
    }
  }

  async function approveHours() {
    try {
      const res = await api.post(`/opportunities/${id}/attendance/approve-hours`, {});
      setMessage(`تم اعتماد الساعات لعدد ${res.data.creditedCount} طالب/ة`);
      await loadOpportunity();
    } catch (err) {
      setMessage(apiErrorMessage(err));
    }
  }

  async function copyLink() {
    if (!opportunity) return;
    await navigator.clipboard.writeText(opportunity.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function deleteOpportunity() {
    if (!confirm("هل أنت متأكد من حذف هذه الفرصة؟ سيتم حذف كل الطلبات والحضور المرتبط بها. لا يمكن التراجع.")) return;
    try {
      await api.delete(`/opportunities/${id}`);
      navigate("/teacher");
    } catch (err) {
      setMessage(apiErrorMessage(err));
    }
  }

  if (!opportunity) return <div className="mx-auto max-w-5xl px-4 py-8 text-gray-500">جارِ التحميل...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold">{opportunity.title}</h1>
            <Badge status={opportunity.status} />
          </div>
          <p className="text-gray-600">{opportunity.description}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
            <span className="rounded-full bg-gray-100 px-2 py-1">{opportunity.field}</span>
            <span>
              {formatDateTime(opportunity.startAt)} — {formatDateTime(opportunity.endAt)}
            </span>
            <span>{opportunity.hours} ساعة لكل متطوع</span>
            <span>الحد الأقصى: {opportunity.maxVolunteers}</span>
          </div>
        </div>
        <button className="btn-danger shrink-0" onClick={deleteOpportunity}>
          حذف الفرصة
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-700">
          {message}
          <button className="mr-3 text-xs text-gray-500 underline" onClick={() => setMessage(null)}>
            إغلاق
          </button>
        </div>
      )}

      {/* Share link + QR */}
      <div className="card mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {opportunity.qrCodeDataUrl && (
          <img src={opportunity.qrCodeDataUrl} alt="QR Code" className="h-32 w-32 rounded-lg border" />
        )}
        <div className="flex-1">
          <h3 className="mb-2 font-semibold">رابط المشاركة (Telegram / WhatsApp)</h3>
          <div className="flex gap-2">
            <input readOnly className="input" value={opportunity.shareUrl} />
            <button className="btn-secondary shrink-0" onClick={copyLink}>
              {copied ? "تم النسخ ✓" : "نسخ الرابط"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => downloadFile(`/reports/opportunities/${id}/roster.xlsx`, "roster.xlsx")}>
              تصدير Excel
            </button>
            <button className="btn-secondary" onClick={() => downloadFile(`/reports/opportunities/${id}/roster.pdf`, "roster.pdf")}>
              تصدير PDF
            </button>
            <button className="btn-primary" onClick={approveHours}>
              اعتماد ورصد الساعات
            </button>
          </div>
        </div>
      </div>

      {/* Applications */}
      <div className="card mb-6">
        <h3 className="mb-3 font-semibold">الطلبات المقدمة</h3>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input className="input" placeholder="تصفية حسب الصف" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} />
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">كل الحالات</option>
            <option value="PENDING">قيد المراجعة</option>
            <option value="ACCEPTED">مقبول</option>
            <option value="REJECTED">مرفوض</option>
          </select>
          <input className="input" placeholder="تصفية حسب المهارات" value={skillsFilter} onChange={(e) => setSkillsFilter(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2">الاسم</th>
                <th>الصف</th>
                <th>المهارات</th>
                <th>الحالة</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-2">{a.student?.name}</td>
                  <td>{a.student?.grade ?? "-"}</td>
                  <td>{a.skills ?? "-"}</td>
                  <td>
                    <Badge status={a.status} />
                  </td>
                  <td>
                    {a.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <button className="btn-primary !px-2 !py-1 text-xs" onClick={() => decide(a.id, "ACCEPTED")}>
                          قبول
                        </button>
                        <button className="btn-danger !px-2 !py-1 text-xs" onClick={() => decide(a.id, "REJECTED")}>
                          رفض
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">
                    لا توجد طلبات مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance tracker */}
      <div className="card">
        <h3 className="mb-3 font-semibold">كشف التحضير الرقمي</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2">الاسم</th>
                <th>رقم الطالب</th>
                <th>الصف</th>
                <th>الحضور</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="py-2">{row.student.name}</td>
                  <td>{row.student.studentNumber ?? "-"}</td>
                  <td>{row.student.grade ?? "-"}</td>
                  <td>
                    <button
                      onClick={() => toggleAttendance(row)}
                      className={row.present ? "btn-primary !px-3 !py-1 text-xs" : "btn-secondary !px-3 !py-1 text-xs"}
                    >
                      {row.present ? "حاضر ✓" : "تحديد كحاضر"}
                    </button>
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400">
                    لا يوجد طلاب مقبولين بعد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
