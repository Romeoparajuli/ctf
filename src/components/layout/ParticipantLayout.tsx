import { Outlet } from "react-router-dom";
import styles from "./PageShell.module.css";
import { SiteHeader } from "./SiteHeader";
import { NotificationBell } from "./NotificationBell";

const NAV = [
  { to: "/dashboard", label: "Overview", end: true },
  { to: "/dashboard/profile", label: "My Profile" },
];

export function ParticipantLayout() {
  return (
    <div className={styles.shell}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <SiteHeader navItems={NAV} extra={<NotificationBell />} />
      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
