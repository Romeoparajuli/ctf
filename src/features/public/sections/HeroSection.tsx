import { Link } from "react-router-dom";
import type { User } from "../../../types/domain";
import type { EventSummary } from "../../../types/domain";
import { Badge, Button } from "../../../components/ui";
import { RegisterNowButton } from "../../../components/registration/RegisterNowButton";
import { getDefaultRoute } from "../../../auth/roleRouting";
import { REGISTRATION_STATE_LABEL } from "../../../utils/format";
import { BRAND } from "../content";
import styles from "../HomePage.module.css";

interface HeroSectionProps {
  event: EventSummary;
  user: User | null;
  isStaff: boolean;
  canRegister: boolean;
}

export function HeroSection({ event, user, isStaff, canRegister }: HeroSectionProps) {
  return (
    <section className={styles.hero} id="event">
      <div className={`container ${styles.heroGrid}`}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>
            <Badge tone={canRegister ? "success" : "neutral"}>{REGISTRATION_STATE_LABEL[event.registrationState]}</Badge>
            National-Level CTF Competition
          </span>
          <h1 className={styles.title}>{event.name}</h1>
          <p className={styles.tagline}>{BRAND.tagline}</p>
          <p className={styles.description}>
            {event.shortDescription} A national-level Capture the Flag competition bringing together
            students, young professionals, and cybersecurity enthusiasts to test their skills through
            practical challenges in a safe, legal, and controlled environment.
          </p>
          <p className={styles.heroMissionLine}>{BRAND.footerTagline}</p>

          <div className={styles.heroActions}>
            {isStaff ? (
              <Link to={getDefaultRoute(user)}>
                <Button>Go to Admin Dashboard</Button>
              </Link>
            ) : (
              <>
                <RegisterNowButton eventId={event.id} disabled={!canRegister}>
                  {canRegister ? "Register Now" : "Registration Unavailable"}
                </RegisterNowButton>
                {user ? (
                  <Link to={getDefaultRoute(user)}>
                    <Button variant="secondary">Go to dashboard</Button>
                  </Link>
                ) : (
                  <a href="#competition" className={styles.textLinkButton}>
                    Explore the Competition
                  </a>
                )}
              </>
            )}
          </div>
        </div>

        <div className={styles.heroVisual} aria-hidden="true">
          <CyberMotif />
        </div>
      </div>
    </section>
  );
}

function CyberMotif() {
  return (
    <svg width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M140 20 L230 55 V135 C230 195 192 235 140 258 C88 235 50 195 50 135 V55 Z"
        stroke="var(--color-border-strong)"
        strokeWidth="1.5"
      />
      <path
        d="M140 46 L206 72 V134 C206 182 178 213 140 232 C102 213 74 182 74 134 V72 Z"
        stroke="var(--color-primary)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <circle cx="140" cy="140" r="3" fill="var(--color-primary)" />
      <g stroke="var(--color-border-strong)" strokeWidth="1">
        <line x1="140" y1="140" x2="90" y2="90" />
        <line x1="140" y1="140" x2="190" y2="95" />
        <line x1="140" y1="140" x2="100" y2="190" />
        <line x1="140" y1="140" x2="185" y2="185" />
        <line x1="140" y1="140" x2="140" y2="70" />
      </g>
      <g fill="var(--color-accent)" fillOpacity="0.8">
        <circle cx="90" cy="90" r="3" />
        <circle cx="190" cy="95" r="3" />
        <circle cx="100" cy="190" r="3" />
        <circle cx="185" cy="185" r="3" />
        <circle cx="140" cy="70" r="3" />
      </g>
    </svg>
  );
}
