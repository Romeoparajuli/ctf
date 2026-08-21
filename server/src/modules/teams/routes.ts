import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorize.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { Errors } from "../../shared/errors.js";
import { db } from "../../db/connection.js";

export const teamsRouter = Router();

teamsRouter.use(requireAuth, requirePermission("teams.view"));

teamsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
    const rows = db
      .prepare(
        `SELECT t.*, e.name as event_name, (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
         FROM teams t JOIN events e ON e.id = t.event_id
         ${eventId ? "WHERE t.event_id = ?" : ""}
         ORDER BY t.created_at DESC`
      )
      .all(...(eventId ? [eventId] : []));
    res.json({ items: rows });
  })
);

teamsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const team = db.prepare(`SELECT * FROM teams WHERE id = ?`).get(Number(req.params.id));
    if (!team) throw Errors.notFound("Team not found.");
    const members = db
      .prepare(`SELECT * FROM team_members WHERE team_id = ? ORDER BY role DESC, id ASC`)
      .all(Number(req.params.id));
    res.json({ team, members });
  })
);
