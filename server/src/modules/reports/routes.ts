import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorize.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { Errors } from "../../shared/errors.js";
import { db } from "../../db/connection.js";
import { recordAudit } from "../audit/service.js";
import { REPORT_DEFINITIONS } from "./definitions.js";
import { buildCsv, buildDocx, buildPdf, buildXlsx, type ExportMeta } from "./exporters.js";
import type { ExportFormat, ReportFilters } from "./types.js";
import { EXPORT_FORMATS } from "./types.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth, requirePermission("reports.view"));

const CONTENT_TYPES: Record<ExportFormat, string> = {
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  json: "application/json",
};

function parseFilters(query: Record<string, unknown>): ReportFilters {
  const filters: ReportFilters = {};
  if (query.eventId) filters.eventId = Number(query.eventId);
  if (typeof query.status === "string" && query.status) filters.status = query.status;
  if (typeof query.dateFrom === "string" && query.dateFrom) filters.dateFrom = query.dateFrom;
  if (typeof query.dateTo === "string" && query.dateTo) filters.dateTo = query.dateTo;
  if (typeof query.search === "string" && query.search) filters.search = query.search;
  return filters;
}

function describeFilters(filters: ReportFilters, eventName?: string): { label: string; value: string }[] {
  const described: { label: string; value: string }[] = [];
  if (filters.eventId) described.push({ label: "Event", value: eventName ?? `#${filters.eventId}` });
  if (filters.status) described.push({ label: "Status", value: filters.status });
  if (filters.dateFrom) described.push({ label: "From", value: filters.dateFrom });
  if (filters.dateTo) described.push({ label: "To", value: filters.dateTo });
  if (filters.search) described.push({ label: "Search", value: filters.search });
  return described;
}

function buildFilename(reportTitle: string, format: ExportFormat, filtered: boolean): string {
  const safeTitle = reportTitle.replace(/\s+/g, "_");
  const datePart = new Date().toISOString().slice(0, 10);
  const suffix = filtered ? `Filtered_${datePart}` : datePart;
  return `Nepal_CTF_${safeTitle}_${suffix}.${format}`;
}

reportsRouter.get(
  "/:reportId",
  asyncHandler(async (req, res) => {
    const definition = REPORT_DEFINITIONS[req.params.reportId];
    if (!definition) throw Errors.notFound("Unknown report.");

    const format = ((req.query.format as string) || "json") as ExportFormat;
    if (!EXPORT_FORMATS.includes(format) && format !== "json") {
      throw Errors.validation(`Unsupported export format "${format}".`);
    }

    const filters = parseFilters(req.query as Record<string, unknown>);
    const rows = definition.fetchRows(filters);

    // Viewing report data on-screen only needs reports.view (already
    // enforced above); actually downloading a file — any format, CSV
    // included — is a distinct, more sensitive action and requires
    // reports.export explicitly. This was previously only checked for
    // audit-logging purposes, not for actually blocking the download.
    if (format !== "json") {
      if (!req.user!.permissions.includes("reports.export")) {
        throw Errors.forbidden("You do not have permission to export reports.");
      }
    }

    if (format === "json") {
      res.json({ items: rows });
      return;
    }

    let eventName: string | undefined;
    if (filters.eventId) {
      const event = db.prepare(`SELECT name FROM events WHERE id = ?`).get(filters.eventId) as
        | { name: string }
        | undefined;
      eventName = event?.name;
    }

    const meta: ExportMeta = {
      title: definition.title,
      eventName,
      generatedBy: req.user!.fullName,
      generatedAt: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
      filters: describeFilters(filters, eventName),
      summary: definition.computeSummary?.(rows),
    };

    const filename = buildFilename(definition.title, format, meta.filters.length > 0);

    recordAudit({
      userId: req.user!.id,
      action: "REPORT_EXPORTED",
      entityType: "report",
      entityId: definition.id,
      newValue: { format, filters },
      req,
    });

    res.setHeader("Content-Type", CONTENT_TYPES[format]);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    switch (format) {
      case "csv":
        res.send(buildCsv(rows, definition.columns));
        break;
      case "xlsx":
        res.send(await buildXlsx(rows, definition.columns, meta));
        break;
      case "pdf":
        res.send(await buildPdf(rows, definition.columns, meta));
        break;
      case "docx":
        res.send(await buildDocx(rows, definition.columns, meta));
        break;
    }
  })
);

reportsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({
      items: Object.values(REPORT_DEFINITIONS).map((d) => ({
        id: d.id,
        title: d.title,
        supportedFilters: d.supportedFilters,
      })),
    });
  })
);
