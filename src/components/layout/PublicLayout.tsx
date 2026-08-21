import { Outlet } from "react-router-dom";
import styles from "./PageShell.module.css";
import { SiteHeader } from "./SiteHeader";
import { useAuth } from "../../auth/AuthContext";
import { NotificationBell } from "./NotificationBell";

const NAV = [{ to: "/", label: "Event", end: true }];

export function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className={styles.shell}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <SiteHeader navItems={NAV} extra={user ? <NotificationBell /> : undefined} />
      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <span>© {new Date().getFullYear()} Nepal CTF</span>
          <span className={styles.footerMeta}>Registration &amp; Event Management Platform</span>
        </div>
      </footer>
    </div>
  );
}
