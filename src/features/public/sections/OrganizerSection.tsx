import { Card } from "../../../components/ui";
import { BRAND } from "../content";
import styles from "../HomePage.module.css";

export function OrganizerSection() {
  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.sectionHeader}>
        <p className={styles.sectionEyebrow}>Organized By</p>
        <h2 className={styles.sectionTitle}>The Team Behind Nepal Cyber Shield</h2>
      </div>

      <Card>
        <div className={styles.organizerRow}>
          <span className={styles.organizerMark} aria-hidden="true">
            RC
          </span>
          <div>
            <p className={styles.organizerName}>{BRAND.organizer}</p>
            <p className={styles.organizerDescription}>
              Nepal Cyber Shield 2026 is organized by the {BRAND.organizer} as part of an initiative to
              discover cyber talent, promote ethical hacking, and build a more secure digital Nepal.
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}
