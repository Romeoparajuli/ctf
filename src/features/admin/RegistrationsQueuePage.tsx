import { useState } from "react";
import { Link } from "react-router-dom";
import { useAsyncData } from "../../hooks/useAsyncData";
import { registrationsApi } from "../../api/registrations";
import { Alert, EmptyState, Select, Spinner, StatusBadge } from "../../components/ui";
import { formatDate } from "../../utils/format";
import styles from "./Admin.module.css";

const STATUS_OPTIONS = [
  "", "DRAFT", "TERMS_ACCEPTED", "TEAM_CREATED", "PARTICIPANTS_ADDED", "PAYMENT_PENDING",
  "PAYMENT_SUBMITTED", "PAYMENT_VERIFIED", "ADMIN_REVIEW", "APPROVED", "REJECTED", "CANCELLED",
];

export function RegistrationsQueuePage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useAsyncData(
    () => registrationsApi.list({ status: status || undefined, page, pageSize }),
    [status, page]
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Registrations</h1>
          <p className={styles.subtitle}>Review and manage all team registrations.</p>
        </div>
      </div>

      <div className={styles.filters}>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s || "All statuses"}
            </option>
          ))}
        </Select>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {isLoading ? (
        <Spinner label="Loading registrations" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No registrations found" description="Try a different filter." />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Team</th>
                  <th>Applicant</th>
                  <th>Participants</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id}>
                    <td>REG-{String(r.id).padStart(4, "0")}</td>
                    <td>{r.team_name ?? "—"}</td>
                    <td>{r.applicant_name}</td>
                    <td>{r.participant_count}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>{r.payment_status ? <StatusBadge status={r.payment_status} /> : "—"}</td>
                    <td>{formatDate(r.updated_at)}</td>
                    <td>
                      <Link to={`/admin/registrations/${r.id}`}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <span>
              Page {data.page} of {Math.max(1, Math.ceil(data.total / data.pageSize))} ({data.total} total)
            </span>
            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <button disabled={page * pageSize >= data.total} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
