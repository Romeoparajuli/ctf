import { useState } from "react";
import { downloadReportCsv, ReportName } from "../../api/reports";
import { errorMessage } from "../../hooks/useAsyncData";
import { Alert, Button, Card } from "../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import styles from "./Admin.module.css";

const REPORTS: { name: ReportName; title: string; description: string }[] = [
  { name: "registrations", title: "Registration Report", description: "All registrations with status and fee." },
  { name: "teams", title: "Team Report", description: "Teams with captain and member counts." },
  { name: "participants", title: "Participant Report", description: "Every registered participant." },
  { name: "payments", title: "Payment Report", description: "Payment records with reference and status." },
  { name: "revenue", title: "Revenue Report", description: "Verified revenue by event and period." },
  { name: "approvals", title: "Approval Report", description: "Approved and rejected registrations." },
  { name: "users", title: "User Report", description: "All user accounts." },
];

export function ReportsPage() {
  const { hasPermission } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<ReportName | null>(null);

  const canExport = hasPermission("reports.export");

  const handleDownload = async (name: ReportName) => {
    setError(null);
    setDownloading(name);
    try {
      await downloadReportCsv(name);
    } catch (err) {
      setError(errorMessage(err, "Could not generate report."));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.subtitle}>Export operational data as CSV for further analysis.</p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {!canExport && <Alert variant="info">You can view report data but exporting requires the reports.export permission.</Alert>}

      <div className={styles.reportGrid}>
        {REPORTS.map((report) => (
          <Card key={report.name}>
            <h2 className={styles.sectionTitle}>{report.title}</h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
              {report.description}
            </p>
            <Button
              variant="secondary"
              onClick={() => handleDownload(report.name)}
              isLoading={downloading === report.name}
              disabled={!canExport}
            >
              Download CSV
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
