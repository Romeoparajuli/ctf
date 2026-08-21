import { Link } from "react-router-dom";
import type { User } from "../../../types/domain";
import type { EventSummary } from "../../../types/domain";
import { Button } from "../../../components/ui";
import { RegisterNowButton } from "../../../components/registration/RegisterNowButton";
import { getDefaultRoute } from "../../../auth/roleRouting";
import { BRAND } from "../content";
import styles from "../HomePage.module.css";

interface FinalCtaSectionProps {
  event: EventSummary;
  user: User | null;
  isStaff: boolean;
  canRegister: boolean;
}

export function FinalCtaSection({ event, user, isStaff, canRegister }: FinalCtaSectionProps) {
  return (
    <section className={`container ${styles.finalCta}`}>
      <h2 className={styles.finalCtaTitle}>Think You Can Find the Flag?</h2>
      <p className={styles.finalCtaText}>
        Join Nepal Cyber Shield 2026 and put your cybersecurity skills to the test alongside the country's
        emerging talent.
      </p>

      <div className={styles.finalCtaActions}>
        {isStaff ? (
          <Link to={getDefaultRoute(user)}>
            <Button>Go to Admin Dashboard</Button>
          </Link>
        ) : (
          <RegisterNowButton eventId={event.id} disabled={!canRegister}>
            {canRegister ? "Register Now" : "Registration Unavailable"}
          </RegisterNowButton>
        )}
      </div>

      <p className={styles.finalCtaClosing}>{BRAND.closingLine}</p>
      <p className={styles.finalCtaBrandLine}>Nepal Cyber Shield 2026</p>
    </section>
  );
}
