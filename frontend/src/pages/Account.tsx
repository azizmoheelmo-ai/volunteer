import { useState, type FormEvent } from "react";
import { api, apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function Account() {
  const { user, setUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState(user?.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await api.patch("/auth/me", {
        currentPassword,
        newEmail: newEmail !== user?.email ? newEmail : undefined,
        newPassword: newPassword || undefined,
      });
      setUser(res.data.user);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("تم تحديث بيانات حسابك بنجاح");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">حسابي</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">البريد الإلكتروني</label>
          <input type="email" required className="input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">كلمة مرور جديدة (اتركها فارغة إذا ما تبي تغييرها)</label>
          <input
            type="password"
            minLength={6}
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <hr />
        <div>
          <label className="label">كلمة المرور الحالية (مطلوبة للتأكيد)</label>
          <input
            type="password"
            required
            className="input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-brand-700">{message}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "جارِ الحفظ..." : "حفظ التغييرات"}
        </button>
      </form>
    </div>
  );
}
