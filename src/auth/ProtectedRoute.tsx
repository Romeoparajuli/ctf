import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Spinner } from "../components/ui";

interface ProtectedRouteProps {
  children: ReactNode;
  /** If given, at least one of these permissions is required in addition to being authenticated. */
  anyPermission?: string[];
}

export function ProtectedRoute({ children, anyPermission }: ProtectedRouteProps) {
  const { user, isLoading, hasAnyPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-16)" }}>
        <Spinner label="Checking your session" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (anyPermission && !hasAnyPermission(anyPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
