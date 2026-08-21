import styles from "./Stepper.module.css";

export interface StepperStep {
  key: string;
  label: string;
}

export interface StepperProps {
  steps: StepperStep[];
  currentIndex: number;
}

export function Stepper({ steps, currentIndex }: StepperProps) {
  return (
    <ol className={styles.stepper} aria-label="Registration progress">
      {steps.map((step, index) => {
        const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "";
        return (
          <li key={step.key} style={{ display: "contents" }}>
            <div className={`${styles.step} ${state ? styles[state] : ""}`} aria-current={index === currentIndex ? "step" : undefined}>
              <span className={styles.circle} aria-hidden="true">
                {index < currentIndex ? "✓" : index + 1}
              </span>
              <span className={styles.label}>{step.label}</span>
            </div>
            {index < steps.length - 1 && <span className={styles.connector} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
