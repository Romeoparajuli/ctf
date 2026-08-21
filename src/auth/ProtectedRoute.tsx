import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { getDefaultRoute, hasAdminAccess } from "./roleRouting";
import { Spinner } from "../components/ui";

interface ProtectedRouteProps {
  children: ReactNode;
  /** If given, at least one of these permissions is required in addition to being authenticated. */
  anyPermission?: readonly string[];
  /**
   * Marks a route as belonging to the participant workspace. Staff/admin
   * accounts (anyone with an ADMIN_ENTRY_PERMISSIONS permission) are
   * redirected to their own workspace instead — registration status must
   * never substitute for this role check, and this applies even on direct
   * URL entry, not just in-app navigation.
   */
  participantOnly?: boolean;
}

export function ProtectedRoute({ children, anyPermission, participantOnly }: ProtectedRouteProps) {
  const { user, isLoading, hasAnyPermission } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-16)" }}>
        <Spinner label="Checking your session" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (anyPermission && !hasAnyPermission(anyPermission)) {
    return <Navigate to={getDefaultRoute(user)} replace />;
  }

  if (participantOnly && hasAdminAccess(user)) {
    return <Navigate to={getDefaultRoute(user)} replace />;
  }

  return <>{children}</>;
}
