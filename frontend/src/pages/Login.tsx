import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiErrorMessage } from "../api/client";
import { homePathForRole } from "../types";

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      navigate(homePathForRole(loggedInUser.role));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="inline-block rounded-lg bg-brand-600 px-3 py-1.5 text-2xl font-bold text-white">تطوع بدر</span>
          <p className="mt-2 text-gray-500">التطوع المدرسي الذكي</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="label">كلمة المرور</label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "جارِ الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          طالب جديد؟{" "}
          <Link to="/register" className="font-medium text-brand-700 hover:underline">
            أنشئ حساباً
          </Link>
        </p>
      </div>
    </div>
  );
}
