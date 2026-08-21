import { useAsyncData } from "../../hooks/useAsyncData";
import { analyticsApi } from "../../api/analytics";
import { Alert, Card, Spinner } from "../../components/ui";
import { formatCurrency } from "../../utils/format";
import styles from "./Admin.module.css";

function BarList({ rows, valueFormatter }: { rows: { label: string; value: number }[]; valueFormatter?: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className={styles.barChart}>
      {rows.map((row) => (
        <div className={styles.barRow} key={row.label}>
          <span>{row.label}</span>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
          <span>{valueFormatter ? valueFormatter(row.value) : row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsPage() {
  const { data: reg, isLoading: regLoading, error: regError } = useAsyncData(() => analyticsApi.registrations(), []);
  const { data: pay, isLoading: payLoading, error: payError } = useAsyncData(() => analyticsApi.payments(), []);
  const { data: part, isLoading: partLoading, error: partError } = useAsyncData(() => analyticsApi.participants(), []);
  const { data: users, isLoading: usersLoading, error: usersError } = useAsyncData(() => analyticsApi.users(), []);

  const isLoading = regLoading || payLoading || partLoading || usersLoading;
  const error = regError || payError || partError || usersError;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>Derived directly from persisted registration and payment data.</p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {isLoading ? (
        <Spinner label="Loading analytics" />
      ) : (
        <div className={styles.detailGrid}>
          <div>
            <Card className={styles.section}>
              <h2 className={styles.sectionTitle}>Registrations by Status</h2>
              {reg && reg.byStatus.length > 0 ? (
                <BarList rows={reg.byStatus.map((s) => ({ label: s.status, value: s.count }))} />
              ) : (
                <p style={{ color: "var(--color-text-faint)" }}>No data yet.</p>
              )}
            </Card>

            <Card className={styles.section}>
              <h2 className={styles.sectionTitle}>Early vs Late Registrations</h2>
              {reg && reg.byPeriod.length > 0 ? (
                <BarList rows={reg.byPeriod.map((p) => ({ label: p.period, value: p.count }))} />
              ) : (
                <p style={{ color: "var(--color-text-faint)" }}>No data yet.</p>
              )}
            </Card>

            <Card className={styles.section}>
              <h2 className={styles.sectionTitle}>Payments by Status</h2>
              {pay && pay.byStatus.length > 0 ? (
                <BarList
                  rows={pay.byStatus.map((s) => ({ label: s.status, value: s.amount }))}
                  valueFormatter={formatCurrency}
                />
              ) : (
                <p style={{ color: "var(--color-text-faint)" }}>No data yet.</p>
              )}
            </Card>

            <Card className={styles.section}>
              <h2 className={styles.sectionTitle}>Participants per Team</h2>
              {part && part.perTeam.length > 0 ? (
                <BarList rows={part.perTeam.map((t) => ({ label: t.team, value: t.count }))} />
              ) : (
                <p style={{ color: "var(--color-text-faint)" }}>No data yet.</p>
              )}
            </Card>

            <Card className={styles.section}>
              <h2 className={styles.sectionTitle}>Institution Distribution</h2>
              {part && part.byInstitution.length > 0 ? (
                <BarList rows={part.byInstitution.map((i) => ({ label: i.institution, value: i.count }))} />
              ) : (
                <p style={{ color: "var(--color-text-faint)" }}>No data yet.</p>
              )}
            </Card>
          </div>

          <div>
            <Card className={styles.section}>
              <h2 className={styles.sectionTitle}>User Analytics</h2>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Total users</span>
                <span>{users?.totalUsers}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Active users</span>
                <span>{users?.activeUsers}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Registration conversion</span>
                <span>{users ? `${Math.round(users.conversionRate * 100)}%` : "—"}</span>
              </div>
            </Card>

            <Card className={styles.section}>
              <h2 className={styles.sectionTitle}>Revenue by Period</h2>
              {pay && pay.revenueByPeriod.length > 0 ? (
                <BarList
                  rows={pay.revenueByPeriod.map((r) => ({ label: r.period ?? "Unassigned", value: r.revenue }))}
                  valueFormatter={formatCurrency}
                />
              ) : (
                <p style={{ color: "var(--color-text-faint)" }}>No verified revenue yet.</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
