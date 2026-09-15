import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
          <span className="rounded-md bg-brand-600 px-2 py-1 text-white">بيان</span>
          <span className="hidden text-sm text-gray-500 sm:inline">التطوع المدرسي الذكي</span>
        </Link>

        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">
              {user.name} <span className="text-gray-400">({user.role === "TEACHER" ? "مشرف تطوع" : "طالب"})</span>
            </span>
            <button onClick={logout} className="btn-secondary">
              تسجيل الخروج
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
