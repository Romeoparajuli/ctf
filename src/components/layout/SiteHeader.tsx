import { ReactNode, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import styles from "./SiteHeader.module.css";
import { useAuth } from "../../auth/AuthContext";
import { getDefaultRoute, hasAdminAccess } from "../../auth/roleRouting";
import { Button } from "../ui";

const EVENT_NAME = "Nepal Cyber Shield";

export interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

export function SiteHeader({ navItems, extra }: { navItems: NavItem[]; extra?: ReactNode }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo} aria-label={`${EVENT_NAME} home`}>
          <span className={styles.logoMark} aria-hidden="true" />
          {EVENT_NAME}
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {navItems.map((item) =>
            item.to.includes("#") ? (
              <a key={item.to} href={item.to} className={styles.navLink}>
                {item.label}
              </a>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
              >
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className={styles.actions}>
          {extra}
          {user ? (
            <div className={styles.userMenu}>
              <button
                type="button"
                className={styles.userButton}
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                {user.fullName}
              </button>
              {menuOpen && (
                <div className={styles.dropdown} role="menu">
                  <Link to={getDefaultRoute(user)} role="menuitem" onClick={() => setMenuOpen(false)}>
                    {hasAdminAccess(user) ? "Admin Dashboard" : "Dashboard"}
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className={styles.textLink}>
                Log in
              </Link>
              <Link to="/signup">
                <Button>Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
