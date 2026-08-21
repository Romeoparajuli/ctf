import { useAsyncData } from "../../../hooks/useAsyncData";
import { termsApi, type TermsRecord } from "../../../api/terms";
import { Alert, EmptyState, Modal, Spinner } from "../../../components/ui";
import { formatDate } from "../../../utils/format";
import styles from "./Terms.module.css";

export interface TermsAcceptancesModalProps {
  terms: TermsRecord;
  onClose: () => void;
}

export function TermsAcceptancesModal({ terms, onClose }: TermsAcceptancesModalProps) {
  const { data, isLoading, error } = useAsyncData(() => termsApi.acceptances(terms.id), [terms.id]);

  return (
    <Modal open title={`Acceptance History — ${terms.title} v${terms.version}`} onClose={onClose}>
      {error && <Alert variant="error">{error}</Alert>}
      {isLoading ? (
        <Spinner label="Loading acceptances" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No one has accepted this version yet" />
      ) : (
        <>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
            {data.items.length} participant{data.items.length === 1 ? "" : "s"} accepted this version.
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Email</th>
                  <th>Team</th>
                  <th>Accepted At</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((a) => (
                  <tr key={a.id}>
                    <td>{a.full_name}</td>
                    <td>{a.email}</td>
                    <td>{a.team_name ?? "—"}</td>
                    <td>{formatDate(a.accepted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  );
}
