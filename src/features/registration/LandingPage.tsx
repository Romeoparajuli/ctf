import { Link } from "react-router-dom";
import { Badge, Card } from "../../components/ui";
import { EVENT_NAME, TEAM_MAX_SIZE } from "../../services/api/config";
import styles from "./LandingPage.module.css";

const CHECKLIST = [
  "A working email address you can access now.",
  "A team name — pick one before you start, changes later require an organizer.",
  `Whether you're forming a team of up to ${TEAM_MAX_SIZE}, or joining one that already exists.`,
];

const STEPS = [
  { step: "01", title: "Register", body: "Create your competitor account." },
  { step: "02", title: "Create or Join", body: "Start a new team or join one with its shared credentials." },
  { step: "03", title: "Compete", body: "Land on the scoreboard and start solving." },
];

export function LandingPage() {
  return (
    <div className={styles.page}>
      <section className={`container ${styles.hero}`}>
        <div className={styles.heroCopy}>
          <span className="eyebrow">Team Registration</span>
          <h1 className={styles.title}>{EVENT_NAME}</h1>
          <p className={styles.lede}>
            A team-based capture-the-flag competition. Register your account, then form or
            join a team of up to {TEAM_MAX_SIZE} — your team's combined solves put you on the
            scoreboard.
          </p>

          <div className={styles.ctaRow}>
            <Link to="/register/create" className={styles.primaryCta}>
              Create a Team
            </Link>
            <Link to="/register/join" className={styles.secondaryCta}>
              Join an Existing Team
            </Link>
          </div>
        </div>

        <Card className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <span className={styles.statusDot} aria-hidden="true" />
            <span className={styles.statusLabel}>Registration status</span>
          </div>
          <p className={styles.statusValue}>OPEN</p>
          <dl className={styles.statusList}>
            <div>
              <dt>Team size</dt>
              <dd>1 – {TEAM_MAX_SIZE} members</dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>Jeopardy + KoTH</dd>
            </div>
            <div>
              <dt>Cost</dt>
              <dd>Free to enter</dd>
            </div>
          </dl>
        </Card>
      </section>

      <section className={`container ${styles.section}`}>
        <div className={styles.sectionHeading}>
          <Badge tone="primary">Before you register</Badge>
          <h2 className={styles.sectionTitle}>What you'll need</h2>
        </div>
        <ul className={styles.checklist}>
          {CHECKLIST.map((item) => (
            <li key={item} className={styles.checklistItem}>
              <span className={styles.checkMark} aria-hidden="true">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={`container ${styles.section}`}>
        <div className={styles.sectionHeading}>
          <Badge tone="accent">How it works</Badge>
          <h2 className={styles.sectionTitle}>Three steps to the scoreboard</h2>
        </div>
        <ol className={styles.steps}>
          {STEPS.map((s) => (
            <li key={s.step} className={styles.step}>
              <span className={styles.stepNumber}>{s.step}</span>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepBody}>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`container ${styles.section}`}>
        <div className={styles.pathCards}>
          <Card className={styles.pathCard}>
            <span className="eyebrow">New team</span>
            <h3 className={styles.pathTitle}>Create a Team</h3>
            <p className={styles.pathBody}>
              Become team captain. You'll set a team name and password, then share the
              password with teammates so they can join.
            </p>
            <Link to="/register/create" className={styles.pathLink}>
              Start creating →
            </Link>
          </Card>
          <Card className={styles.pathCard}>
            <span className="eyebrow">Have credentials?</span>
            <h3 className={styles.pathTitle}>Join a Team</h3>
            <p className={styles.pathBody}>
              Your captain already created a team and shared its name and password with you.
              Use them here to join.
            </p>
            <Link to="/register/join" className={styles.pathLink}>
              Start joining →
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
}
