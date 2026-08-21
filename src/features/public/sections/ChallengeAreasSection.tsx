import { CHALLENGE_AREAS } from "../content";
import styles from "../HomePage.module.css";

export function ChallengeAreasSection() {
  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.sectionHeader}>
        <p className={styles.sectionEyebrow}>What to Expect</p>
        <h2 className={styles.sectionTitle}>Challenge Areas</h2>
      </div>

      <div className={styles.tagGrid}>
        {CHALLENGE_AREAS.map((area) => (
          <span className={styles.tag} key={area}>
            {area}
          </span>
        ))}
      </div>
      <p className={styles.disclaimer}>
        Final challenge categories, difficulty distribution, and scoring structure will be published in the
        official competition rules ahead of the qualifier.
      </p>
    </section>
  );
}
