import { Link } from "react-router-dom";
import { useAsyncData } from "../../hooks/useAsyncData";
import { analyticsApi } from "../../api/analytics";
import { registrationsApi } from "../../api/registrations";
import { Alert, Badge, Card, Spinner, StatusBadge } from "../../components/ui";
import { formatCurrency, formatDate } from "../../utils/format";
import styles from "./Admin.module.css";

export function AdminDashboardPage() {
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useAsyncData(() => analyticsApi.kpis(), []);
  const {
    data: pending,
    isLoading: pendingLoading,
    error: pendingError,
  } = useAsyncData(() => registrationsApi.list({ status: "ADMIN_REVIEW", pageSize: 5 }), []);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>Operational overview across registrations, payments and users.</p>
        </div>
      </div>

      {kpisError && <Alert variant="error">{kpisError}</Alert>}

      {kpisLoading ? (
        <Spinner label="Loading KPIs" />
      ) : (
        kpis && (
          <div className={styles.kpiGrid}>
            <Card>
              <p className={styles.kpiLabel}>Total Users</p>
              <p className={styles.kpiValue}>{kpis.totalUsers}</p>
            </Card>
            <Card>
              <p className={styles.kpiLabel}>Total Teams</p>
              <p className={styles.kpiValue}>{kpis.totalTeams}</p>
            </Card>
            <Card>
              <p className={styles.kpiLabel}>Total Participants</p>
              <p className={styles.kpiValue}>{kpis.totalParticipants}</p>
            </Card>
            <Card>
              <p className={styles.kpiLabel}>Pending Registrations</p>
              <p className={styles.kpiValue}>{kpis.pendingRegistrations}</p>
            </Card>
            <Card>
              <p className={styles.kpiLabel}>Approved Registrations</p>
              <p className={styles.kpiValue}>{kpis.approvedRegistrations}</p>
            </Card>
            <Card>
              <p className={styles.kpiLabel}>Pending Payments</p>
              <p className={styles.kpiValue}>{kpis.pendingPayments}</p>
            </Card>
            <Card>
              <p className={styles.kpiLabel}>Verified Payments</p>
              <p className={styles.kpiValue}>{kpis.verifiedPayments}</p>
            </Card>
            <Card>
              <p className={styles.kpiLabel}>Verified Revenue</p>
              <p className={styles.kpiValue}>{formatCurrency(kpis.verifiedRevenue)}</p>
            </Card>
          </div>
        )
      )}

      <Card>
        <h2 className={styles.sectionTitle}>Pending Admin Review</h2>
        {pendingError ? (
          <Alert variant="error">{pendingError}</Alert>
        ) : pendingLoading ? (
          <Spinner label="Loading queue" />
        ) : pending && pending.items.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Applicant</th>
                  <th>Participants</th>
                  <th>Payment</th>
                  <th>Submitted</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pending.items.map((r) => (
                  <tr key={r.id}>
                    <td>{r.team_name}</td>
                    <td>{r.applicant_name}</td>
                    <td>{r.participant_count}</td>
                    <td>{r.payment_status && <StatusBadge status={r.payment_status} />}</td>
                    <td>{formatDate(r.updated_at)}</td>
                    <td>
                      <Link to={`/admin/registrations/${r.id}`}>Review</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Badge tone="success">Queue is empty</Badge>
        )}
      </Card>
    </div>
  );
}
