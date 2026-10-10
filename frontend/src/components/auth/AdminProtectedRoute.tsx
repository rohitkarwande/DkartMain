import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function AdminProtectedRoute() {
  const { data: user, isLoading } = useAuth();
  const token = localStorage.getItem("token");

  const is2FaVerified = localStorage.getItem("admin_2fa_verified") === "true";

  if (!token || !is2FaVerified) {
    return <Navigate to="/secret-admin-portal" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
