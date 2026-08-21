import { Link, NavLink, Outlet } from "react-router-dom";
import styles from "./AdminLayout.module.css";
import { useAuth } from "../../auth/AuthContext";
import { NotificationBell } from "./NotificationBell";

interface AdminNavItem {
  to: string;
  label: string;
  end?: boolean;
  permission?: string;
}

interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

const NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [{ to: "/admin", label: "Dashboard", end: true }],
  },
  {
    label: "Event Management",
    items: [{ to: "/admin/events", label: "Events", permission: "events.view" }],
  },
  {
    label: "Registration",
    items: [
      { to: "/admin/registrations", label: "All Registrations", permission: "registrations.view" },
      { to: "/admin/teams", label: "Teams", permission: "teams.view" },
    ],
  },
  {
    label: "Payments",
    items: [{ to: "/admin/payments", label: "Payments", permission: "payments.view" }],
  },
  {
    label: "Administration",
    items: [
      { to: "/admin/users", label: "Users", permission: "users.view" },
      { to: "/admin/roles", label: "Roles & Permissions", permission: "roles.view" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/admin/analytics", label: "Analytics", permission: "analytics.view" },
      { to: "/admin/reports", label: "Reports", permission: "reports.view" },
      { to: "/admin/audit-logs", label: "Audit Logs", permission: "audit_logs.view" },
    ],
  },
  {
    label: "System",
    items: [{ to: "/admin/settings", label: "System Settings", permission: "system_settings.view" }],
  },
];

export function AdminLayout() {
  const { hasPermission } = useAuth();

  return (
    <div className={styles.shell}>
      <a href="#admin-main-content" className="skip-link">
        Skip to main content
      </a>
      <header className={styles.topbar}>
        <Link to="/admin" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
          Nepal CTF Admin
        </Link>
        <div className={styles.topActions}>
          <NotificationBell />
          <Link to="/dashboard" className={styles.exitLink}>
            Exit to site
          </Link>
        </div>
      </header>
      <div className={styles.body}>
        <nav className={styles.sidebar} aria-label="Admin">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => !item.permission || hasPermission(item.permission));
            if (visibleItems.length === 0) return null;
            return (
              <div className={styles.group} key={group.label}>
                <div className={styles.groupLabel}>{group.label}</div>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ""}`}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
        <main id="admin-main-content" className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
