import { Link } from "react-router-dom";
import { useAsyncData } from "../../hooks/useAsyncData";
import { eventsApi } from "../../api/events";
import { useAuth } from "../../auth/AuthContext";
import { getDefaultRoute, hasAdminAccess } from "../../auth/roleRouting";
import { Alert, Badge, Button, Card, Spinner } from "../../components/ui";
import { RegisterNowButton } from "../../components/registration/RegisterNowButton";
import { formatCurrency, formatDateOnly, REGISTRATION_STATE_LABEL } from "../../utils/format";
import styles from "./HomePage.module.css";

export function HomePage() {
  const { user } = useAuth();
  const isStaff = hasAdminAccess(user);

  const { data, isLoading, error } = useAsyncData(() => eventsApi.list(), []);
  const event = data?.items[0];

  if (isLoading) {
    return (
      <div className="container" style={{ padding: "var(--space-16) 0", display: "flex", justifyContent: "center" }}>
        <Spinner label="Loading event" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingBlock: "var(--space-16)" }}>
        <Alert variant="error" title="Could not load the event">
          {error}
        </Alert>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container" style={{ paddingBlock: "var(--space-16)" }}>
        <Alert variant="info" title="No event published yet">
          Check back soon — event details will appear here once published.
        </Alert>
      </div>
    );
  }

  const canRegister = event.registrationState === "EARLY" || event.registrationState === "LATE";

  return (
    <div>
      <section className={styles.hero}>
        <div className="container">
          <span className={styles.eyebrow}>
            <Badge tone={canRegister ? "success" : "neutral"}>{REGISTRATION_STATE_LABEL[event.registrationState]}</Badge>
          </span>
          <h1 className={styles.title}>{event.name}</h1>
          <p className={styles.description}>{event.shortDescription ?? event.description}</p>

          <div className={styles.heroActions}>
            {isStaff ? (
              // Staff/admin accounts are administrative users, not participants —
              // they never see the participant registration CTA (Section 1).
              <Link to={getDefaultRoute(user)}>
                <Button>Go to Admin Dashboard</Button>
              </Link>
            ) : (
              <>
                <RegisterNowButton eventId={event.id} disabled={!canRegister}>
                  {canRegister ? "Register Now" : "Registration Unavailable"}
                </RegisterNowButton>
                {user && (
                  <Link to={getDefaultRoute(user)}>
                    <Button variant="secondary">Go to dashboard</Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="container">
        <div className={styles.metaGrid}>
          <Card>
            <p className={styles.metaLabel}>Venue</p>
            <p className={styles.metaValue}>{event.venue ?? "TBA"}</p>
          </Card>
          <Card>
            <p className={styles.metaLabel}>Event Dates</p>
            <p className={styles.metaValue}>{formatDateOnly(event.eventStartDate)}</p>
          </Card>
          <Card>
            <p className={styles.metaLabel}>Prize Pool</p>
            <p className={styles.metaValue}>{event.prizePool ?? "TBA"}</p>
          </Card>
          <Card>
            <p className={styles.metaLabel}>Current Registration Fee</p>
            <p className={styles.metaValue}>
              {event.currentFee !== null ? formatCurrency(event.currentFee) : "Closed"}
            </p>
          </Card>
        </div>
      </section>

      <section className="container">
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Registration Pricing</h2>
          <div className={styles.metaGrid}>
            <Card>
              <p className={styles.metaLabel}>Early Registration</p>
              <p className={styles.metaValue}>{formatCurrency(event.earlyRegistrationFee)}</p>
              <p style={{ color: "var(--color-text-faint)", fontSize: "var(--text-xs)", marginTop: "var(--space-2)" }}>
                Until {formatDateOnly(event.earlyRegistrationEndDate)}
              </p>
            </Card>
            <Card>
              <p className={styles.metaLabel}>Late Registration</p>
              <p className={styles.metaValue}>{formatCurrency(event.lateRegistrationFee)}</p>
              <p style={{ color: "var(--color-text-faint)", fontSize: "var(--text-xs)", marginTop: "var(--space-2)" }}>
                Until {formatDateOnly(event.lateRegistrationEndDate)}
              </p>
            </Card>
            <Card>
              <p className={styles.metaLabel}>Team Size</p>
              <p className={styles.metaValue}>
                {event.minTeamSize === event.maxTeamSize
                  ? `${event.minTeamSize}`
                  : `${event.minTeamSize}–${event.maxTeamSize}`}{" "}
                participants
              </p>
            </Card>
          </div>
        </div>
      </section>

      {event.description && (
        <section className="container">
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>About the Event</h2>
            <p className={styles.prose}>{event.description}</p>
          </div>
        </section>
      )}

      {event.rules && (
        <section className="container">
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Rules</h2>
            <p className={styles.prose}>{event.rules}</p>
          </div>
        </section>
      )}
    </div>
  );
}
