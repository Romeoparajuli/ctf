import { useState } from "react";
import { Link } from "react-router-dom";
import { errorMessage, useAsyncData } from "../../hooks/useAsyncData";
import { paymentsApi } from "../../api/payments";
import { Alert, EmptyState, Select, Spinner, StatusBadge } from "../../components/ui";
import { formatCurrency, formatDate } from "../../utils/format";
import styles from "./Admin.module.css";

const STATUS_OPTIONS = ["", "PENDING", "SUBMITTED", "UNDER_REVIEW", "VERIFIED", "REJECTED"];

export function PaymentsQueuePage() {
  const [status, setStatus] = useState("SUBMITTED");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useAsyncData(
    () => paymentsApi.list({ status: status || undefined, page, pageSize }),
    [status, page]
  );

  const handleVerify = async (id: number) => {
    setActionError(null);
    try {
      await paymentsApi.verify(id);
      refetch();
    } catch (err) {
      setActionError(errorMessage(err, "Could not verify payment."));
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Payments</h1>
          <p className={styles.subtitle}>Verify submitted payments before registrations can proceed to review.</p>
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

      {(error || actionError) && <Alert variant="error">{error ?? actionError}</Alert>}

      {isLoading ? (
        <Spinner label="Loading payments" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No payments found" description="Try a different filter." />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Applicant</th>
                  <th>Amount</th>
                  <th>Reference</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id}>
                    <td>{p.team_name ?? "—"}</td>
                    <td>{p.applicant_name}</td>
                    <td>{formatCurrency(p.amount)}</td>
                    <td>{p.reference ?? "—"}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>{formatDate(p.updated_at)}</td>
                    <td className={styles.rowActions}>
                      {["SUBMITTED", "UNDER_REVIEW"].includes(p.status) && (
                        <button onClick={() => handleVerify(p.id)}>Verify</button>
                      )}
                      <Link to={`/admin/registrations/${p.registration_id}`}>View</Link>
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
