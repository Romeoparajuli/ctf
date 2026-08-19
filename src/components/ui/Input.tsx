import { InputHTMLAttributes, forwardRef } from "react";
import styles from "./Input.module.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid, className, ...rest }, ref) => {
    const classes = [styles.input, invalid ? styles.invalid : "", className ?? ""]
      .filter(Boolean)
      .join(" ");

    return <input ref={ref} className={classes} {...rest} />;
  }
);

Input.displayName = "Input";
