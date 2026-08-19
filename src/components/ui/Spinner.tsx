import styles from "./Spinner.module.css";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function Spinner({ size = "md", label = "Loading" }: SpinnerProps) {
  return (
    <span className={`${styles.spinner} ${styles[size]}`} role="status">
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
