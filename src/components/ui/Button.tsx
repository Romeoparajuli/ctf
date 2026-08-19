import { ButtonHTMLAttributes, forwardRef } from "react";
import styles from "./Button.module.css";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      fullWidth = false,
      isLoading = false,
      loadingText,
      disabled,
      children,
      className,
      type = "button",
      ...rest
    },
    ref
  ) => {
    const classes = [
      styles.button,
      styles[variant],
      fullWidth ? styles.fullWidth : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...rest}
      >
        {isLoading && <Spinner size="sm" />}
        <span className={isLoading ? styles.loadingLabel : undefined}>
          {isLoading && loadingText ? loadingText : children}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";
