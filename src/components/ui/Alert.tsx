import { ReactNode } from "react";
import styles from "./Alert.module.css";

export type AlertVariant = "success" | "warning" | "error" | "info";

export interface AlertProps {
  variant: AlertVariant;
  title?: string;
  children: ReactNode;
}

const ICONS: Record<AlertVariant, ReactNode> = {
  success: (
    <path d="M4 10.5 8 14l8-9" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  error: (
    <>
      <path d="M10 6v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="14" r="1" fill="currentColor" />
    </>
  ),
  warning: (
    <>
      <path d="M10 3 2 17h16L10 3Z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <path d="M10 8.5v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="0.9" fill="currentColor" />
    </>
  ),
  info: (
    <>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M10 9v4.5M10 6.5v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
};

const LABELS: Record<AlertVariant, string> = {
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Notice",
};

export function Alert({ variant, title, children }: AlertProps) {
  const role = variant === "error" || variant === "warning" ? "alert" : "status";

  return (
    <div className={`${styles.alert} ${styles[variant]}`} role={role}>
      <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true">
        {ICONS[variant]}
      </svg>
      <div className={styles.body}>
        <p className={styles.title}>{title ?? LABELS[variant]}</p>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
