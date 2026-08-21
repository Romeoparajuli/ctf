import { TextareaHTMLAttributes, forwardRef } from "react";
import styles from "./Input.module.css";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid, className, ...rest }, ref) => {
    const classes = [styles.input, invalid ? styles.invalid : "", className ?? ""].filter(Boolean).join(" ");
    return <textarea ref={ref} className={classes} {...rest} />;
  }
);

Textarea.displayName = "Textarea";
