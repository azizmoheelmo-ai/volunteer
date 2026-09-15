import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../../api/client";
import { Modal } from "../../components/Modal";
import type { Role, User } from "../../types";

const ROLE_LABELS: Record<Role, string> = {
  TEACHER: "مشرف تطوع",
  STUDENT: "طالب",
  ADMIN: "مسؤول النظام",
};

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", grade: "", studentNumber: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get("/admin/users", { params: { role: roleFilter || undefined } })
      .then((res) => setUsers(res.data.users))
      .finally(() => setLoading(false));
  }

  useEffect(load, [roleFilter]);

  function openEdit(user: User) {
    setEditTarget(user);
    setForm({
      name: user.name,
      grade: user.grade ?? "",
      studentNumber: user.studentNumber ?? "",
      phone: user.phone ?? "",
    });
    setError(null);
  }

  async function saveEdit() {
    if (!editTarget) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/admin/users/${editTarget.id}`, form);
      setEditTarget(null);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(user: User) {
    if (!confirm(`هل أنت متأكد من حذف "${user.name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      setMessage(`تم حذف "${user.name}"`);
      load();
    } catch (err) {
      setMessage(apiErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">إدارة المستخدمين</h1>

      {message && (
        <div className="mb-4 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-700">
          {message}
          <button className="mr-3 text-xs text-gray-500 underline" onClick={() => setMessage(null)}>
            إغلاق
          </button>
        </div>
      )}

      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm text-gray-600">تصفية حسب الدور:</label>
          <select className="input max-w-xs" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">الكل</option>
            <option value="TEACHER">مشرف تطوع</option>
            <option value="STUDENT">طالب</option>
            <option value="ADMIN">مسؤول النظام</option>
          </select>
        </div>

        {loading ? (
          <p className="text-gray-500">جارِ التحميل...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-2">الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>الدور</th>
                  <th>الصف</th>
                  <th>رقم الطالب</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2">{u.name}</td>
                    <td>{u.email}</td>
                    <td>{ROLE_LABELS[u.role]}</td>
                    <td>{u.grade ?? "-"}</td>
                    <td>{u.studentNumber ?? "-"}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => openEdit(u)}>
                          تعديل
                        </button>
                        <button className="btn-danger !px-2 !py-1 text-xs" onClick={() => deleteUser(u)}>
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-400">
                      لا يوجد مستخدمون
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editTarget && (
        <Modal title={`تعديل بيانات: ${editTarget.name}`} onClose={() => setEditTarget(null)}>
          <div className="space-y-4">
            <div>
              <label className="label">الاسم</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">الصف/الشعبة</label>
              <input className="input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
            </div>
            <div>
              <label className="label">رقم الطالب</label>
              <input
                className="input"
                value={form.studentNumber}
                onChange={(e) => setForm({ ...form, studentNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="label">رقم الجوال</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full" disabled={saving} onClick={saveEdit}>
              {saving ? "جارِ الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
