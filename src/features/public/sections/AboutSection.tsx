import type { EventSummary } from "../../../types/domain";
import styles from "../HomePage.module.css";

export function AboutSection({ event }: { event: EventSummary }) {
  if (!event.description) return null;
  const paragraphs = event.description.split("\n\n").filter(Boolean);

  return (
    <section className={`container ${styles.section}`} id="about">
      <div className={styles.aboutGrid}>
        <h2 className={styles.aboutHeading}>About the Event</h2>
        <div className={styles.aboutProse}>
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
