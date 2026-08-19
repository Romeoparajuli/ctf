import { ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./PageShell.module.css";
import { EVENT_NAME } from "../../services/api/config";

export interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className={styles.shell}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <Link to="/" className={styles.logo} aria-label={`${EVENT_NAME} home`}>
            <span className={styles.logoMark} aria-hidden="true" />
            {EVENT_NAME}
          </Link>
          <span className={styles.headerTag}>Team Registration</span>
        </div>
      </header>

      <main id="main-content" className={styles.main}>
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <span>© {new Date().getFullYear()} {EVENT_NAME}</span>
          <span className={styles.footerMeta}>Powered by CTFd</span>
        </div>
      </footer>
    </div>
  );
}
