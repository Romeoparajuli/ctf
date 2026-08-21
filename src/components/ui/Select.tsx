import { SelectHTMLAttributes, forwardRef } from "react";
import styles from "./Input.module.css";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ invalid, className, children, ...rest }, ref) => {
    const classes = [styles.input, invalid ? styles.invalid : "", className ?? ""].filter(Boolean).join(" ");
    return (
      <select ref={ref} className={classes} {...rest}>
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
