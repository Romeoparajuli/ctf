import { useAuth } from "../../../auth/AuthContext";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { listReportMeta } from "../../../api/reports";
import { eventsApi } from "../../../api/events";
import { Alert, Spinner } from "../../../components/ui";
import { ReportCard } from "./ReportCard";
import styles from "./Reports.module.css";

export function ReportsPage() {
  const { hasPermission } = useAuth();
  const canExport = hasPermission("reports.export");

  const { data: metaData, isLoading: metaLoading, error: metaError } = useAsyncData(() => listReportMeta(), []);
  const { data: eventsData } = useAsyncData(() => eventsApi.list(), []);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Reports</h1>
        <p className={styles.subtitle}>
          Filter each report, then export it as PDF, Excel, Word or CSV — export uses exactly the records shown.
        </p>
      </div>

      {metaError && <Alert variant="error">{metaError}</Alert>}
      {!canExport && (
        <Alert variant="info">You can view report data but exporting requires the reports.export permission.</Alert>
      )}

      {metaLoading ? (
        <Spinner label="Loading reports" />
      ) : (
        <div className={styles.reportList}>
          {metaData?.items.map((meta) => (
            <ReportCard key={meta.id} meta={meta} events={eventsData?.items ?? []} canExport={canExport} />
          ))}
        </div>
      )}
    </div>
  );
}
