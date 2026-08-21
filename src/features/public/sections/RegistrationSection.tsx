import { Link } from "react-router-dom";
import type { User } from "../../../types/domain";
import type { EventSummary } from "../../../types/domain";
import { Card, Button } from "../../../components/ui";
import { RegisterNowButton } from "../../../components/registration/RegisterNowButton";
import { getDefaultRoute } from "../../../auth/roleRouting";
import { formatCurrency, formatDateOnly } from "../../../utils/format";
import styles from "../HomePage.module.css";

interface RegistrationSectionProps {
  event: EventSummary;
  user: User | null;
  isStaff: boolean;
  canRegister: boolean;
}

export function RegistrationSection({ event, user, isStaff, canRegister }: RegistrationSectionProps) {
  return (
    <section className={`container ${styles.section}`} id="registration">
      <div className={styles.sectionHeader}>
        <p className={styles.sectionEyebrow}>Registration</p>
        <h2 className={styles.sectionTitle}>Secure Your Spot</h2>
        <p className={styles.sectionSubtitle}>
          Teams of {event.minTeamSize === event.maxTeamSize ? event.minTeamSize : `${event.minTeamSize}–${event.maxTeamSize}`}{" "}
          participants can register below. Fees increase after the early registration window closes.
        </p>
      </div>

      <div className={styles.registrationGrid}>
        <Card className={styles.priceCard}>
          <p className={styles.priceLabel}>Early Registration</p>
          <p className={styles.priceValue}>{formatCurrency(event.earlyRegistrationFee)}</p>
          <p className={styles.priceNote}>Until {formatDateOnly(event.earlyRegistrationEndDate)}</p>
        </Card>
        <Card className={styles.priceCard}>
          <p className={styles.priceLabel}>Late Registration</p>
          <p className={styles.priceValue}>{formatCurrency(event.lateRegistrationFee)}</p>
          <p className={styles.priceNote}>Until {formatDateOnly(event.lateRegistrationEndDate)}</p>
        </Card>
        <Card className={styles.priceCard}>
          <p className={styles.priceLabel}>Team Size</p>
          <p className={styles.priceValue}>
            {event.minTeamSize === event.maxTeamSize
              ? `${event.minTeamSize}`
              : `${event.minTeamSize}–${event.maxTeamSize}`}
          </p>
          <p className={styles.priceNote}>Participants per team</p>
        </Card>
      </div>

      {!isStaff && (
        <div className={styles.heroActions}>
          <RegisterNowButton eventId={event.id} disabled={!canRegister}>
            {canRegister ? "Register Now" : "Registration Unavailable"}
          </RegisterNowButton>
          {user && (
            <Link to={getDefaultRoute(user)}>
              <Button variant="secondary">Go to dashboard</Button>
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
