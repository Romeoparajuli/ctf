import { db } from "../../db/connection.js";

export type NotificationType =
  | "ACCOUNT_CREATED"
  | "REGISTRATION_SUBMITTED"
  | "PAYMENT_SUBMITTED"
  | "PAYMENT_VERIFIED"
  | "PAYMENT_REJECTED"
  | "REGISTRATION_APPROVED"
  | "REGISTRATION_REJECTED"
  | "EVENT_UPDATE";

export function notify(userId: number, type: NotificationType, title: string, message: string): void {
  db.prepare(
    `INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)`
  ).run(userId, type, title, message);
}

export function listNotifications(userId: number) {
  return db
    .prepare(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`)
    .all(userId);
}

export function unreadCount(userId: number): number {
  return (
    db
      .prepare(`SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`)
      .get(userId) as { count: number }
  ).count;
}

export function markRead(userId: number, notificationId: number): void {
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`).run(
    notificationId,
    userId
  );
}

export function markAllRead(userId: number): void {
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`).run(userId);
}
