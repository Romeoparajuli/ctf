import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Toast.module.css";
import { Alert } from "./Alert";
import type { AlertVariant } from "./Alert";

interface ToastItem {
  id: number;
  variant: AlertVariant;
  title?: string;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, variant?: AlertVariant, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, variant: AlertVariant = "info", title?: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, variant, title, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className={styles.viewport} aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={styles.toast}>
              <Alert variant={toast.variant} title={toast.title}>
                {toast.message}
              </Alert>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider.");
  return ctx;
}
