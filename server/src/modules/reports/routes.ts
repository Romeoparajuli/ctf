import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorize.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { db } from "../../db/connection.js";
import { toCsv } from "../../shared/csv.js";
import { recordAudit } from "../audit/service.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth, requirePermission("reports.view"));

function sendReport(req: Request, res: Response, name: string, rows: Record<string, unknown>[]) {
  const format = (req.query.format as string) ?? "json";
  if (format === "csv") {
    if (req.user!.permissions.includes("reports.export")) {
      recordAudit({ userId: req.user!.id, action: "REPORT_EXPORTED", entityType: "report", entityId: name, req });
    }
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${name}.csv"`);
    res.send(toCsv(rows));
    return;
  }
  res.json({ items: rows });
}

reportsRouter.get(
  "/registrations",
  asyncHandler(async (req, res) => {
    const rows = db
      .prepare(
        `SELECT r.id, e.name as event, t.name as team, u.full_name as applicant, u.email,
                r.status, r.registration_period, r.fee_amount, r.created_at, r.submitted_at
         FROM registrations r
         LEFT JOIN events e ON e.id = r.event_id
         LEFT JOIN teams t ON t.id = r.team_id
         LEFT JOIN users u ON u.id = r.user_id
         ORDER BY r.created_at DESC`
      )
      .all() as Record<string, unknown>[];
    sendReport(req, res, "registration-report", rows);
  })
);

reportsRouter.get(
  "/teams",
  asyncHandler(async (req, res) => {
    const rows = db
      .prepare(
        `SELECT t.id, t.name, e.name as event, t.institution, u.full_name as captain,
                (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count, t.created_at
         FROM teams t LEFT JOIN events e ON e.id = t.event_id LEFT JOIN users u ON u.id = t.captain_user_id
         ORDER BY t.created_at DESC`
      )
      .all() as Record<string, unknown>[];
    sendReport(req, res, "team-report", rows);
  })
);

reportsRouter.get(
  "/participants",
  asyncHandler(async (req, res) => {
    const rows = db
      .prepare(
        `SELECT tm.id, tm.name, tm.email, tm.phone, tm.institution, tm.role, t.name as team, e.name as event
         FROM team_members tm JOIN teams t ON t.id = tm.team_id LEFT JOIN events e ON e.id = t.event_id
         ORDER BY tm.id DESC`
      )
      .all() as Record<string, unknown>[];
    sendReport(req, res, "participant-report", rows);
  })
);

reportsRouter.get(
  "/payments",
  asyncHandler(async (req, res) => {
    const rows = db
      .prepare(
        `SELECT p.id, t.name as team, e.name as event, p.amount, p.method, p.reference, p.status,
                p.submitted_at, p.reviewed_at
         FROM payments p JOIN registrations r ON r.id = p.registration_id
         LEFT JOIN teams t ON t.id = r.team_id LEFT JOIN events e ON e.id = r.event_id
         ORDER BY p.updated_at DESC`
      )
      .all() as Record<string, unknown>[];
    sendReport(req, res, "payment-report", rows);
  })
);

reportsRouter.get(
  "/revenue",
  asyncHandler(async (req, res) => {
    const rows = db
      .prepare(
        `SELECT e.name as event, r.registration_period as period, COUNT(*) as verified_payments,
                COALESCE(SUM(p.amount),0) as revenue
         FROM payments p JOIN registrations r ON r.id = p.registration_id LEFT JOIN events e ON e.id = r.event_id
         WHERE p.status = 'VERIFIED'
         GROUP BY e.id, r.registration_period`
      )
      .all() as Record<string, unknown>[];
    sendReport(req, res, "revenue-report", rows);
  })
);

reportsRouter.get(
  "/approvals",
  asyncHandler(async (req, res) => {
    const rows = db
      .prepare(
        `SELECT r.id, t.name as team, e.name as event, r.status, r.reviewed_at, ru.full_name as reviewed_by,
                r.rejection_reason
         FROM registrations r LEFT JOIN teams t ON t.id = r.team_id LEFT JOIN events e ON e.id = r.event_id
         LEFT JOIN users ru ON ru.id = r.reviewed_by_user_id
         WHERE r.status IN ('APPROVED','REJECTED')
         ORDER BY r.reviewed_at DESC`
      )
      .all() as Record<string, unknown>[];
    sendReport(req, res, "approval-report", rows);
  })
);

reportsRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    const rows = db
      .prepare(`SELECT id, full_name, email, phone, status, created_at FROM users ORDER BY created_at DESC`)
      .all() as Record<string, unknown>[];
    sendReport(req, res, "user-report", rows);
  })
);
