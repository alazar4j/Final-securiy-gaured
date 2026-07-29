import { type ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import { Spinner } from "./Toast";

export default function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { user, initialized, fetchMe } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!initialized) fetchMe();
  }, [initialized, fetchMe]);

  if (!initialized) {
    return <Spinner label="" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
