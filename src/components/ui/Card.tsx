import { HTMLAttributes } from "react";
import styles from "./Card.module.css";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export function Card({ padded = true, className, ...rest }: CardProps) {
  const classes = [styles.card, padded ? styles.padded : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
  return <div className={classes} {...rest} />;
}
