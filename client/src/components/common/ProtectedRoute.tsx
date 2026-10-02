import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingState from "../ui/LoadingState";
import { UserRole } from "../../types";

export default function ProtectedRoute({ allow }: { allow?: UserRole[] }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState message="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
