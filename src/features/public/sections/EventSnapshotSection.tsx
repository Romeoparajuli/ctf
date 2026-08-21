import type { EventSummary } from "../../../types/domain";
import { Card } from "../../../components/ui";
import { formatCurrency } from "../../../utils/format";
import { BRAND } from "../content";
import styles from "../HomePage.module.css";

export function EventSnapshotSection({ event }: { event: EventSummary }) {
  return (
    <section className="container">
      <div className={styles.snapshotGrid}>
        <Card className={styles.snapshotCard}>
          <p className={styles.snapshotLabel}>Online Qualifier</p>
          <p className={styles.snapshotValue}>{BRAND.qualifierDateLabel}</p>
          <p className={styles.snapshotMeta}>Confirmed</p>
        </Card>
        <Card className={styles.snapshotCard}>
          <p className={styles.snapshotLabel}>Final Date &amp; Venue</p>
          <p className={`${styles.snapshotValue} ${styles.tbaValue}`}>{BRAND.finalDateLabel}</p>
          <p className={styles.snapshotMeta}>To be confirmed after the qualifier</p>
        </Card>
        <Card className={styles.snapshotCard}>
          <p className={styles.snapshotLabel}>Prize Pool</p>
          <p className={styles.snapshotValue}>{event.prizePool ?? "To Be Announced"}</p>
        </Card>
        <Card className={styles.snapshotCard}>
          <p className={styles.snapshotLabel}>Current Registration Fee</p>
          <p className={styles.snapshotValue}>
            {event.currentFee !== null ? formatCurrency(event.currentFee) : "Closed"}
          </p>
        </Card>
      </div>
    </section>
  );
}
