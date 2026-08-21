import { Link, useNavigate } from "react-router-dom";
import { useAsyncData } from "../../hooks/useAsyncData";
import { eventsApi } from "../../api/events";
import { registrationsApi } from "../../api/registrations";
import { useAuth } from "../../auth/AuthContext";
import { Alert, Badge, Button, Card, Spinner } from "../../components/ui";
import { formatCurrency, formatDateOnly, REGISTRATION_STATE_LABEL } from "../../utils/format";
import { errorMessage } from "../../hooks/useAsyncData";
import { useState } from "react";
import styles from "./HomePage.module.css";

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const { data, isLoading, error } = useAsyncData(() => eventsApi.list(), []);
  const event = data?.items[0];

  const handleRegisterNow = async () => {
    if (!event) return;
    if (!user) {
      navigate("/login", { state: { from: "/" } });
      return;
    }
    setStartError(null);
    setStarting(true);
    try {
      const existing = await registrationsApi.mine(event.id);
      if (!existing.registration) {
        await registrationsApi.start(event.id);
      }
      navigate(`/register/${event.id}`);
    } catch (err) {
      setStartError(errorMessage(err, "Could not start registration."));
    } finally {
      setStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: "var(--space-16) 0", display: "flex", justifyContent: "center" }}>
        <Spinner label="Loading event" />
      </div>
    );
  }

  if (error || !event) {
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

          {startError && (
            <Alert variant="error" title="Registration error">
              {startError}
            </Alert>
          )}

          <div className={styles.heroActions}>
            <Button onClick={handleRegisterNow} isLoading={starting} disabled={!canRegister} loadingText="Starting…">
              {canRegister ? "Register Now" : "Registration Unavailable"}
            </Button>
            {user && (
              <Link to="/dashboard">
                <Button variant="secondary">Go to dashboard</Button>
              </Link>
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
