import { Outlet } from "react-router-dom";
import styles from "./PageShell.module.css";
import { SiteHeader } from "./SiteHeader";
import { useAuth } from "../../auth/AuthContext";
import { NotificationBell } from "./NotificationBell";

const NAV = [
  { to: "/#event", label: "Event" },
  { to: "/#competition", label: "Competition" },
  { to: "/#registration", label: "Registration" },
  { to: "/#rules", label: "Rules" },
  { to: "/#about", label: "About" },
];

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
          <span>© {new Date().getFullYear()} Nepal Cyber Shield · Organized by Rotaract Club of Lumbini Stars</span>
          <span className={styles.footerMeta}>
            Discover Cyber Talent · Promote Ethical Hacking · Build a Secure Digital Nepal
          </span>
        </div>
      </footer>
    </div>
  );
}
