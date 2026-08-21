import { useEffect, useState } from "react";
import { fetchReportJson, type ReportFilters, type ReportMeta } from "../../../api/reports";
import { errorMessage } from "../../../hooks/useAsyncData";
import { Alert, Card, Input, Select } from "../../../components/ui";
import type { EventSummary } from "../../../types/domain";
import { ReportExportMenu } from "./ReportExportMenu";
import { STATUS_OPTIONS_BY_REPORT } from "./reportFilterOptions";
import styles from "./Reports.module.css";

export interface ReportCardProps {
  meta: ReportMeta;
  events: EventSummary[];
  canExport: boolean;
}

export function ReportCard({ meta, events, canExport }: ReportCardProps) {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [count, setCount] = useState<number | null>(null);
  const [isCounting, setIsCounting] = useState(true);
  const [countError, setCountError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsCounting(true);
    setCountError(null);
    fetchReportJson(meta.id, filters)
      .then((res) => {
        if (!cancelled) setCount(res.items.length);
      })
      .catch((err) => {
        if (!cancelled) setCountError(errorMessage(err, "Could not load this report."));
      })
      .finally(() => {
        if (!cancelled) setIsCounting(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.id, filters.eventId, filters.status, filters.dateFrom, filters.dateTo, filters.search]);

  const statusOptions = STATUS_OPTIONS_BY_REPORT[meta.id];
  const supports = (key: keyof ReportFilters) => meta.supportedFilters.includes(key);

  return (
    <Card>
      <div className={styles.reportHeader}>
        <div>
          <h2 className={styles.reportTitle}>{meta.title}</h2>
          <p className={styles.reportCount}>
            {isCounting ? "Loading…" : countError ? countError : `${count ?? 0} record${count === 1 ? "" : "s"}`}
          </p>
        </div>
        <ReportExportMenu reportId={meta.id} filters={filters} disabled={!canExport} onError={setExportError} />
      </div>

      {exportError && <Alert variant="error">{exportError}</Alert>}

      <div className={styles.filters}>
        {supports("eventId") && (
          <Select
            value={filters.eventId ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, eventId: e.target.value ? Number(e.target.value) : undefined }))}
            aria-label={`Filter ${meta.title} by event`}
          >
            <option value="">Event: All</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </Select>
        )}

        {supports("status") && statusOptions && (
          <Select
            value={filters.status ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
            aria-label={`Filter ${meta.title} by status`}
          >
            <option value="">Status: All</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        )}

        {supports("dateFrom") && (
          <Input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
            aria-label={`${meta.title} date from`}
          />
        )}
        {supports("dateTo") && (
          <Input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
            aria-label={`${meta.title} date to`}
          />
        )}

        {supports("search") && (
          <Input
            placeholder="Search…"
            value={filters.search ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
            aria-label={`Search ${meta.title}`}
          />
        )}
      </div>
    </Card>
  );
}
