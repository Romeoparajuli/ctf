import { useState } from "react";
import { errorMessage, useAsyncData } from "../../hooks/useAsyncData";
import { ctfdApi } from "../../api/ctfd";
import { Alert, Badge, Button, Card, Spinner } from "../../components/ui";
import { formatDate } from "../../utils/format";
import styles from "./Admin.module.css";

export function SystemSettingsPage() {
  const { data, isLoading, refetch } = useAsyncData(() => ctfdApi.status(), []);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setError(null);
    setChecking(true);
    try {
      await refetch();
    } catch (err) {
      setError(errorMessage(err, "Could not check CTFd status."));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>System Settings</h1>
          <p className={styles.subtitle}>Platform-level configuration and external integrations.</p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>CTFd Integration</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
          CTFd owns the competition itself (challenges, scoring). This platform owns users, registration, payment
          and approval, and best-effort mirrors approved teams into CTFd. The <code>/teams/join</code> integration
          must be verified against the live CTFd instance before relying on it in production.
        </p>
        {isLoading ? (
          <Spinner label="Checking CTFd" />
        ) : (
          data && (
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Status</span>
              <span>
                <Badge tone={data.ok ? "success" : "warning"}>{data.ok ? "Reachable" : "Not configured / unreachable"}</Badge>
              </span>
            </div>
          )
        )}
        {data && (
          <>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Message</span>
              <span>{data.message}</span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Last checked</span>
              <span>{formatDate(data.attemptedAt)}</span>
            </div>
          </>
        )}
        <div style={{ marginTop: "var(--space-4)" }}>
          <Button variant="secondary" onClick={handleCheck} isLoading={checking}>
            Re-check connectivity
          </Button>
        </div>
      </Card>
    </div>
  );
}
