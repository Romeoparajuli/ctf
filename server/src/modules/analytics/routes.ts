import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorize.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { db } from "../../db/connection.js";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth, requirePermission("analytics.view"));

analyticsRouter.get(
  "/kpis",
  asyncHandler(async (req, res) => {
    const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
    const eventFilter = eventId ? "WHERE event_id = ?" : "";
    const args = eventId ? [eventId] : [];

    const totalUsers = (db.prepare(`SELECT COUNT(*) as c FROM users`).get() as { c: number }).c;
    const totalTeams = (
      db.prepare(`SELECT COUNT(*) as c FROM teams ${eventFilter}`).get(...args) as { c: number }
    ).c;
    const totalParticipants = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM team_members tm ${eventId ? "JOIN teams t ON t.id = tm.team_id WHERE t.event_id = ?" : ""}`
        )
        .get(...args) as { c: number }
    ).c;
    const pendingRegistrations = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM registrations ${eventFilter}${eventFilter ? " AND" : "WHERE"} status = 'ADMIN_REVIEW'`
        )
        .get(...args) as { c: number }
    ).c;
    const approvedRegistrations = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM registrations ${eventFilter}${eventFilter ? " AND" : "WHERE"} status = 'APPROVED'`
        )
        .get(...args) as { c: number }
    ).c;
    const pendingPayments = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM payments p ${eventId ? "JOIN registrations r ON r.id = p.registration_id WHERE r.event_id = ? AND" : "WHERE"} p.status IN ('SUBMITTED','UNDER_REVIEW')`
        )
        .get(...args) as { c: number }
    ).c;
    const verifiedPayments = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM payments p ${eventId ? "JOIN registrations r ON r.id = p.registration_id WHERE r.event_id = ? AND" : "WHERE"} p.status = 'VERIFIED'`
        )
        .get(...args) as { c: number }
    ).c;
    const expectedRevenue = (
      db
        .prepare(
          `SELECT COALESCE(SUM(amount),0) as total FROM payments p ${eventId ? "JOIN registrations r ON r.id = p.registration_id WHERE r.event_id = ?" : ""}`
        )
        .get(...args) as { total: number }
    ).total;
    const verifiedRevenue = (
      db
        .prepare(
          `SELECT COALESCE(SUM(amount),0) as total FROM payments p ${eventId ? "JOIN registrations r ON r.id = p.registration_id WHERE r.event_id = ? AND" : "WHERE"} p.status = 'VERIFIED'`
        )
        .get(...args) as { total: number }
    ).total;

    res.json({
      totalUsers,
      totalTeams,
      totalParticipants,
      pendingRegistrations,
      approvedRegistrations,
      pendingPayments,
      verifiedPayments,
      expectedRevenue,
      verifiedRevenue,
    });
  })
);

analyticsRouter.get(
  "/registrations",
  asyncHandler(async (req, res) => {
    const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
    const filter = eventId ? "WHERE event_id = ?" : "";
    const args = eventId ? [eventId] : [];

    const daily = db
      .prepare(
        `SELECT substr(created_at,1,10) as date, COUNT(*) as count FROM registrations ${filter}
         GROUP BY date ORDER BY date ASC`
      )
      .all(...args);
    const byPeriod = db
      .prepare(
        `SELECT COALESCE(registration_period,'UNASSIGNED') as period, COUNT(*) as count FROM registrations ${filter}
         GROUP BY period`
      )
      .all(...args);
    const byStatus = db
      .prepare(`SELECT status, COUNT(*) as count FROM registrations ${filter} GROUP BY status`)
      .all(...args);

    res.json({ daily, byPeriod, byStatus });
  })
);

analyticsRouter.get(
  "/payments",
  asyncHandler(async (req, res) => {
    const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
    const join = eventId ? "JOIN registrations r ON r.id = p.registration_id" : "";
    const filter = eventId ? "WHERE r.event_id = ?" : "";
    const args = eventId ? [eventId] : [];

    const byStatus = db
      .prepare(`SELECT p.status, COUNT(*) as count, COALESCE(SUM(p.amount),0) as amount FROM payments p ${join} ${filter} GROUP BY p.status`)
      .all(...args);
    const revenueByPeriod = db
      .prepare(
        `SELECT r.registration_period as period, COALESCE(SUM(p.amount),0) as revenue
         FROM payments p JOIN registrations r ON r.id = p.registration_id
         WHERE p.status = 'VERIFIED' ${eventId ? "AND r.event_id = ?" : ""}
         GROUP BY r.registration_period`
      )
      .all(...args);

    res.json({ byStatus, revenueByPeriod });
  })
);

analyticsRouter.get(
  "/participants",
  asyncHandler(async (req, res) => {
    const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
    const filter = eventId ? "WHERE t.event_id = ?" : "";
    const args = eventId ? [eventId] : [];

    const perTeam = db
      .prepare(
        `SELECT t.name as team, COUNT(tm.id) as count FROM teams t
         LEFT JOIN team_members tm ON tm.team_id = t.id ${filter} GROUP BY t.id ORDER BY count DESC`
      )
      .all(...args);
    const byInstitution = db
      .prepare(
        `SELECT COALESCE(NULLIF(tm.institution,''),'Unspecified') as institution, COUNT(*) as count
         FROM team_members tm ${eventId ? "JOIN teams t ON t.id = tm.team_id" : ""} ${filter}
         GROUP BY institution ORDER BY count DESC`
      )
      .all(...args);

    res.json({ perTeam, byInstitution });
  })
);

analyticsRouter.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const totalUsers = (db.prepare(`SELECT COUNT(*) as c FROM users`).get() as { c: number }).c;
    const activeUsers = (
      db.prepare(`SELECT COUNT(*) as c FROM users WHERE status = 'ACTIVE'`).get() as { c: number }
    ).c;
    const newUsersDaily = db
      .prepare(`SELECT substr(created_at,1,10) as date, COUNT(*) as count FROM users GROUP BY date ORDER BY date ASC`)
      .all();
    const usersWithRegistrations = (
      db.prepare(`SELECT COUNT(DISTINCT user_id) as c FROM registrations`).get() as { c: number }
    ).c;
    const conversionRate = totalUsers > 0 ? usersWithRegistrations / totalUsers : 0;

    res.json({ totalUsers, activeUsers, newUsersDaily, conversionRate });
  })
);
