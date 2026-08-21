import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";

export interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Disables Escape/backdrop dismissal while true (e.g. a save is in flight). */
  busy?: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Generic large-content dialog: header + close button, scrollable body, optional footer. Full focus trap + Escape + focus restoration. */
export function Modal({ open, title, description, onClose, children, footer, busy }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!busy) onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${styles.dialogLarge}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 id="modal-title" className={styles.title} style={{ marginBottom: description ? undefined : 0 }}>
              {title}
            </h2>
            {description && (
              <p id="modal-description" className={styles.description}>
                {description}
              </p>
            )}
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} disabled={busy} aria-label="Close dialog">
            ×
          </button>
        </div>

        <div className={styles.scrollBody}>{children}</div>

        {footer && <div className={styles.actions} style={{ marginTop: "var(--space-6)" }}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
