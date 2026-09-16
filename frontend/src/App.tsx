import { Navigate, Route, Routes, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { homePathForRole } from "./types";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import { RoleTabs } from "./components/RoleTabs";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Account } from "./pages/Account";
import { PublicOpportunityPage } from "./pages/PublicOpportunity";
import { TeacherDashboard } from "./pages/teacher/Dashboard";
import { CreateOpportunity } from "./pages/teacher/CreateOpportunity";
import { OpportunityDetail } from "./pages/teacher/OpportunityDetail";
import { StudentOpportunities } from "./pages/student/Opportunities";
import { StudentWallet } from "./pages/student/Wallet";
import { AdminUsers } from "./pages/admin/Users";

function TeacherLayout() {
  return (
    <div>
      <RoleTabs tabs={[{ to: "/teacher", label: "الفرص التطوعية" }]} />
      <Outlet />
    </div>
  );
}

function StudentLayout() {
  return (
    <div>
      <RoleTabs
        tabs={[
          { to: "/student", label: "الفرص المتاحة" },
          { to: "/student/wallet", label: "محفظتي التطوعية" },
        ]}
      />
      <Outlet />
    </div>
  );
}

function AdminLayout() {
  return (
    <div>
      <RoleTabs
        tabs={[
          { to: "/admin", label: "إدارة المستخدمين" },
          { to: "/teacher", label: "الفرص التطوعية" },
        ]}
      />
      <Outlet />
    </div>
  );
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homePathForRole(user.role)} replace />;
}

export default function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/public/opportunities/:slug" element={<PublicOpportunityPage />} />

        <Route
          path="/account"
          element={
            <ProtectedRoute roles={["TEACHER", "STUDENT", "ADMIN"]}>
              <Account />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher"
          element={
            <ProtectedRoute roles={["TEACHER", "ADMIN"]}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
        </Route>
        <Route
          path="/teacher/opportunities/new"
          element={
            <ProtectedRoute roles={["TEACHER", "ADMIN"]}>
              <CreateOpportunity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/opportunities/:id"
          element={
            <ProtectedRoute roles={["TEACHER", "ADMIN"]}>
              <OpportunityDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student"
          element={
            <ProtectedRoute roles={["STUDENT"]}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentOpportunities />} />
          <Route path="wallet" element={<StudentWallet />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminUsers />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
