import { InputHTMLAttributes, forwardRef, useState } from "react";
import inputStyles from "./Input.module.css";
import styles from "./PasswordInput.module.css";

export interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ invalid, className, id, ...rest }, ref) => {
    const [visible, setVisible] = useState(false);

    const classes = [
      inputStyles.input,
      styles.field,
      invalid ? inputStyles.invalid : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={styles.wrapper}>
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          className={classes}
          autoComplete="new-password"
          {...rest}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-controls={id}
          aria-pressed={visible}
        >
          {visible ? "HIDE" : "SHOW"}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
