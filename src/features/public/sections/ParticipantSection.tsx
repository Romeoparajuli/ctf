import { PARTICIPANT_TYPES } from "../content";
import styles from "../HomePage.module.css";

export function ParticipantSection() {
  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.sectionHeader}>
        <p className={styles.sectionEyebrow}>Eligibility</p>
        <h2 className={styles.sectionTitle}>Who Can Participate</h2>
      </div>

      <div className={styles.checklist}>
        {PARTICIPANT_TYPES.map((type) => (
          <div className={styles.checklistItem} key={type}>
            <span className={styles.checklistIcon} aria-hidden="true">
              ✓
            </span>
            <span>{type}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
