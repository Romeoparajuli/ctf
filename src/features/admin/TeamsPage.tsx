import { useAsyncData } from "../../hooks/useAsyncData";
import { teamsApi } from "../../api/teams";
import { Alert, EmptyState, Spinner } from "../../components/ui";
import { formatDate } from "../../utils/format";
import styles from "./Admin.module.css";

export function TeamsPage() {
  const { data, isLoading, error } = useAsyncData(() => teamsApi.list(), []);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Teams</h1>
          <p className={styles.subtitle}>All registered teams across events.</p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {isLoading ? (
        <Spinner label="Loading teams" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No teams yet" />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Event</th>
                <th>Institution</th>
                <th>Members</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.event_name}</td>
                  <td>{t.institution ?? "—"}</td>
                  <td>{t.member_count}</td>
                  <td>{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
