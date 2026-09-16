import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { homePathForRole } from "../types";

export function Register() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/register", { name, email, password, grade, studentNumber: studentNumber || undefined });
      const loggedInUser = await login(email, password);
      navigate(homePathForRole(loggedInUser.role));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="inline-block rounded-lg bg-brand-600 px-3 py-1.5 text-2xl font-bold text-white">تطوع بدر</span>
          <p className="mt-2 text-gray-500">إنشاء حساب طالب جديد</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">الاسم الكامل</label>
            <input required className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">كلمة المرور</label>
            <input
              type="password"
              required
              minLength={6}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label">الصف/الشعبة</label>
            <input required className="input" placeholder="مثال: 2-1" value={grade} onChange={(e) => setGrade(e.target.value)} />
          </div>
          <div>
            <label className="label">رقم الطالب (اختياري)</label>
            <input className="input" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "جارِ إنشاء الحساب..." : "إنشاء الحساب"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          لديك حساب بالفعل؟{" "}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            سجّل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
