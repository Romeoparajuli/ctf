import type { EventSummary } from "../../../types/domain";
import { REGISTRATION_STATE_LABEL } from "../../../utils/format";
import { formatDateOnly } from "../../../utils/format";
import { BRAND } from "../content";
import styles from "../HomePage.module.css";

export function ImportantDatesSection({ event }: { event: EventSummary }) {
  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.sectionHeader}>
        <p className={styles.sectionEyebrow}>Timeline</p>
        <h2 className={styles.sectionTitle}>Important Dates</h2>
      </div>

      <div className={styles.datesList}>
        <div className={styles.datesRow}>
          <span className={styles.datesLabel}>Registration</span>
          <span className={styles.datesValue}>
            {REGISTRATION_STATE_LABEL[event.registrationState]}
            {event.registrationState !== "CLOSED" && event.lateRegistrationEndDate
              ? ` · Until ${formatDateOnly(event.lateRegistrationEndDate)}`
              : ""}
          </span>
        </div>
        <div className={styles.datesRow}>
          <span className={styles.datesLabel}>Online Qualifier</span>
          <span className={styles.datesValue}>{BRAND.qualifierDateLabel}</span>
        </div>
        <div className={styles.datesRow}>
          <span className={styles.datesLabel}>Grand Final</span>
          <span className={`${styles.datesValue} ${styles.tbaValue}`}>{BRAND.finalDateLabel}</span>
        </div>
        <div className={styles.datesRow}>
          <span className={styles.datesLabel}>Final Venue</span>
          <span className={`${styles.datesValue} ${styles.tbaValue}`}>{BRAND.finalVenueLabel}</span>
        </div>
      </div>
    </section>
  );
}
