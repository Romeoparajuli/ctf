import { useState } from "react";
import { useAsyncData } from "../../hooks/useAsyncData";
import { auditApi } from "../../api/audit";
import { Alert, EmptyState, Input, Spinner } from "../../components/ui";
import { formatDate } from "../../utils/format";
import styles from "./Admin.module.css";

export function AuditLogsPage() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const { data, isLoading, error } = useAsyncData(
    () => auditApi.list({ page, pageSize, action: action || undefined }),
    [action, page]
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Audit Logs</h1>
          <p className={styles.subtitle}>Traceable record of sensitive operations across the platform.</p>
        </div>
      </div>

      <div className={styles.filters}>
        <Input
          placeholder="Filter by action (e.g. REGISTRATION_APPROVED)"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 320 }}
        />
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {isLoading ? (
        <Spinner label="Loading audit logs" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No audit records found" />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.created_at)}</td>
                    <td>{log.user_full_name ?? "System"}</td>
                    <td>{log.action}</td>
                    <td>
                      {log.entity_type}
                      {log.entity_id ? ` #${log.entity_id}` : ""}
                    </td>
                    <td>{log.ip_address ?? "—"}</td>
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
