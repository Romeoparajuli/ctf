import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../components/ui";
import { CTFD_BASE_URL, USE_MOCK_API } from "../../services/api/config";
import styles from "./SuccessPage.module.css";

interface SuccessState {
  teamName: string;
  mode: "created" | "joined";
}

function isSuccessState(value: unknown): value is SuccessState {
  return (
    typeof value === "object" &&
    value !== null &&
    "teamName" in value &&
    "mode" in value
  );
}

export function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = isSuccessState(location.state) ? location.state : null;

  useEffect(() => {
    if (!state) navigate("/", { replace: true });
  }, [state, navigate]);

  if (!state) return null;

  const enterHref = USE_MOCK_API || !CTFD_BASE_URL ? "/" : `${CTFD_BASE_URL}/challenges`;

  return (
    <div className={`container ${styles.page}`}>
      <Card className={styles.card}>
        <div className={styles.badge} aria-hidden="true">
          <svg viewBox="0 0 40 40" className={styles.badgeIcon}>
            <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M12 20.5 17 25.5 28 13.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <span className="eyebrow">
          {state.mode === "created" ? "Team initialized" : "Team joined"}
        </span>

        <h1 className={styles.teamName}>{state.teamName}</h1>

        <p className={styles.message}>
          {state.mode === "created"
            ? "Your team is live. Share the team password with your teammates so they can join before the competition starts."
            : "You're officially on the roster. Good luck out there."}
        </p>

        <div className={styles.actions}>
          <a className={styles.enterCta} href={enterHref}>
            Enter Competition
          </a>
          <Link to="/" className={styles.backLink}>
            Back to home
          </Link>
        </div>
      </Card>
    </div>
  );
}
