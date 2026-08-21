import { WHY_CYBER_SHIELD } from "../content";
import styles from "../HomePage.module.css";

export function WhyCyberShieldSection() {
  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.sectionHeader}>
        <p className={styles.sectionEyebrow}>Why Nepal Cyber Shield</p>
        <h2 className={styles.sectionTitle}>What This Competition Stands For</h2>
      </div>

      <div className={styles.whyGrid}>
        {WHY_CYBER_SHIELD.map((item) => (
          <div className={styles.whyBlock} key={item.index}>
            <p className={styles.whyIndex}>{item.index}</p>
            <h3 className={styles.whyTitle}>{item.title}</h3>
            <p className={styles.whyDescription}>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
