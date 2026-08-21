import { COMPETITION_STAGES } from "../content";
import styles from "../HomePage.module.css";

export function CompetitionFormatSection() {
  return (
    <section className={`container ${styles.section}`} id="competition">
      <div className={styles.sectionHeader}>
        <p className={styles.sectionEyebrow}>Competition Format</p>
        <h2 className={styles.sectionTitle}>Two Stages, One Shield</h2>
        <p className={styles.sectionSubtitle}>
          Nepal Cyber Shield 2026 runs as a two-stage competition — an open online qualifier followed by a
          final round for the top-performing teams.
        </p>
      </div>

      <div className={styles.timeline}>
        <span className={styles.timelineConnector} aria-hidden="true" />
        {COMPETITION_STAGES.map((stage) => (
          <div
            key={stage.stage}
            className={`${styles.timelineStage} ${
              stage.confirmed ? styles.timelineStageConfirmed : styles.timelineStagePending
            }`}
          >
            <span className={styles.timelineMarker}>{stage.stage.replace("Stage ", "")}</span>
            <p className={styles.timelineStageLabel}>{stage.stage}</p>
            <h3 className={styles.timelineTitle}>{stage.title}</h3>
            <p className={styles.timelineDescription}>{stage.description}</p>
            <span className={styles.timelineDate}>{stage.dateLabel}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
