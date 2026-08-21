import type { EventSummary } from "../../../types/domain";
import styles from "../HomePage.module.css";

export function RulesSection({ event }: { event: EventSummary }) {
  if (!event.rules) return null;
  const rules = event.rules.split("\n").filter(Boolean);

  return (
    <section className={`container ${styles.section}`} id="rules">
      <div className={styles.sectionHeader}>
        <p className={styles.sectionEyebrow}>Rules</p>
        <h2 className={styles.sectionTitle}>Competition Rules</h2>
      </div>

      <ol className={styles.rulesList}>
        {rules.map((rule, index) => (
          <li className={styles.rulesItem} key={index}>
            {rule}
          </li>
        ))}
      </ol>

      <p className={styles.rulesClosing}>Play fair. Play ethical. Respect the boundaries of the competition.</p>
    </section>
  );
}
