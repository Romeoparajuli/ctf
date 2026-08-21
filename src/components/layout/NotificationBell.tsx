import { useEffect, useState } from "react";
import styles from "./NotificationBell.module.css";
import { notificationsApi } from "../../api/notifications";
import type { AppNotification } from "../../types/domain";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      notificationsApi
        .list()
        .then(({ notifications, unreadCount }) => {
          if (!cancelled) {
            setNotifications(notifications);
            setUnreadCount(unreadCount);
          }
        })
        .catch(() => undefined);
    };
    load();
    const interval = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      await notificationsApi.markAllRead();
      setUnreadCount(0);
    }
  };

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.button}
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M5 8a5 5 0 0 1 10 0c0 4 1.5 5 1.5 5h-13S5 12 5 8Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M8 15.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && <span className={styles.dot} />}
      </button>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Notifications">
          {notifications.length === 0 ? (
            <p className={styles.empty}>No notifications yet.</p>
          ) : (
            notifications.slice(0, 15).map((n) => (
              <div key={n.id} className={styles.item}>
                <p className={styles.itemTitle}>{n.title}</p>
                <p className={styles.itemMessage}>{n.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
