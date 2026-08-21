import { Link } from "react-router-dom";
import { useAsyncData } from "../../hooks/useAsyncData";
import { eventsApi } from "../../api/events";
import { registrationsApi } from "../../api/registrations";
import { useAuth } from "../../auth/AuthContext";
import { Alert, Badge, Button, Card, EmptyState, Spinner, StatusBadge } from "../../components/ui";
import { formatCurrency } from "../../utils/format";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
  const { user } = useAuth();
  const { data: eventData, isLoading: eventsLoading } = useAsyncData(() => eventsApi.list(), []);
  const event = eventData?.items[0];

  const { data: regData, isLoading: regLoading } = useAsyncData(
    () => (event ? registrationsApi.mine(event.id) : Promise.resolve({ registration: null })),
    [event?.id]
  );

  const isLoading = eventsLoading || regLoading;

  return (
    <div className={`container ${styles.wrap}`}>
      <h1 className={styles.title}>Welcome, {user?.fullName}</h1>

      {isLoading ? (
        <Spinner label="Loading dashboard" />
      ) : !event ? (
        <EmptyState title="No event available" description="There are no published events right now." />
      ) : !regData?.registration ? (
        <Card>
          <EmptyState
            title="You haven't registered yet"
            description={`Register your team for ${event.name} to get started.`}
            action={
              <Link to={`/register/${event.id}`}>
                <Button>Start Registration</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className={styles.grid}>
          <Card>
            <h2 className={styles.sectionTitle}>Registration Status</h2>
            <p style={{ marginBottom: "var(--space-4)" }}>
              <StatusBadge status={regData.registration.registration.status} />
            </p>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Team</span>
              <span>{regData.registration.team?.name ?? "—"}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Participants</span>
              <span>{regData.registration.members.length}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Registration period</span>
              <span>{regData.registration.registration.registration_period ?? "—"}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Fee</span>
              <span>{formatCurrency(regData.registration.registration.fee_amount)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Payment</span>
              <span>
                {regData.registration.payment ? <StatusBadge status={regData.registration.payment.status} /> : <Badge>N/A</Badge>}
              </span>
            </div>

            {regData.registration.registration.status !== "APPROVED" &&
              regData.registration.registration.status !== "REJECTED" && (
                <div style={{ marginTop: "var(--space-6)" }}>
                  <Link to={`/register/${event.id}`}>
                    <Button>Continue Registration</Button>
                  </Link>
                </div>
              )}

            {regData.registration.registration.status === "REJECTED" && (
              <div style={{ marginTop: "var(--space-4)" }}>
                <Alert variant="error" title="Registration rejected">
                  {regData.registration.registration.rejection_reason ?? "See admin review notes."}
                </Alert>
              </div>
            )}

            {regData.registration.registration.status === "APPROVED" && (
              <div style={{ marginTop: "var(--space-4)" }}>
                <Alert variant="success" title="Registration approved">
                  Your team is confirmed for {event.name}. See you at the competition!
                </Alert>
              </div>
            )}
          </Card>

          <Card>
            <h2 className={styles.sectionTitle}>Event</h2>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Name</span>
              <span>{event.name}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Venue</span>
              <span>{event.venue ?? "TBA"}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Status</span>
              <StatusBadge status={event.status} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
