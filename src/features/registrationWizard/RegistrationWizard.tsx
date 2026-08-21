import { useNavigate, useParams } from "react-router-dom";
import { useAsyncData } from "../../hooks/useAsyncData";
import { registrationsApi } from "../../api/registrations";
import { Alert, Card, Spinner, Stepper } from "../../components/ui";
import type { StepperStep } from "../../components/ui";
import { TermsAndConditionsModal } from "../../components/registration/TermsAndConditionsModal";
import { ParticipantsStep, PaymentStep, StatusStep, TeamStep } from "./steps";
import styles from "./RegistrationWizard.module.css";

const STEPS: StepperStep[] = [
  { key: "team", label: "Team" },
  { key: "participants", label: "Participants" },
  { key: "payment", label: "Payment" },
  { key: "submitted", label: "Submitted" },
];

function stepIndexForStatus(status: string): number {
  switch (status) {
    case "TERMS_ACCEPTED":
      return 0;
    case "TEAM_CREATED":
    case "PARTICIPANTS_ADDED":
      return 1;
    case "PAYMENT_PENDING":
      return 2;
    default:
      // PAYMENT_SUBMITTED, PAYMENT_VERIFIED, ADMIN_REVIEW, APPROVED, REJECTED, CANCELLED
      return 3;
  }
}

export function RegistrationWizard() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useAsyncData(
    () => registrationsApi.mine(Number(eventId)),
    [eventId]
  );

  if (isLoading) {
    return (
      <div className="container" style={{ padding: "var(--space-16) 0", display: "flex", justifyContent: "center" }}>
        <Spinner label="Loading your registration" />
      </div>
    );
  }

  if (error || !data?.registration) {
    return (
      <div className="container" style={{ paddingBlock: "var(--space-16)" }}>
        <Alert variant="info" title="No registration found">
          Start your registration from the event page.
        </Alert>
      </div>
    );
  }

  const registration = data.registration;

  // Terms & Conditions are a pre-registration gate, not a wizard step. A
  // registration only reaches this page after accepting them (see
  // RegisterNowButton) — this DRAFT branch is a safety net for a draft that
  // was started before that gate existed, or an interrupted session; it
  // still presents terms as a modal, never as part of the step sequence.
  if (registration.registration.status === "DRAFT") {
    return (
      <div className={`container ${styles.wrap}`}>
        <Card className={styles.stepCard}>
          <h2 className={styles.stepTitle}>Terms &amp; Conditions Required</h2>
          <p className={styles.stepDescription}>
            Accept the event terms to continue your registration for {registration.event.name}.
          </p>
        </Card>
        <TermsAndConditionsModal
          open
          eventId={Number(eventId)}
          onAccepted={async () => {
            await registrationsApi.acceptTerms(registration.registration.id);
            refetch();
          }}
          onCancel={() => navigate("/dashboard")}
        />
      </div>
    );
  }

  const stepIndex = stepIndexForStatus(registration.registration.status);

  let stepContent;
  switch (stepIndex) {
    case 0:
      stepContent = <TeamStep data={registration} onAdvance={refetch} />;
      break;
    case 1:
      stepContent = <ParticipantsStep data={registration} onAdvance={refetch} />;
      break;
    case 2:
      stepContent = <PaymentStep data={registration} onAdvance={refetch} />;
      break;
    default:
      stepContent = <StatusStep data={registration} />;
  }

  return (
    <div className={`container ${styles.wrap}`}>
      <div className={styles.header}>
        <p className={styles.eventName}>{registration.event.name}</p>
        <h1 className={styles.title}>Team Registration</h1>
        <Stepper steps={STEPS} currentIndex={Math.min(stepIndex, STEPS.length - 1)} />
      </div>
      {stepContent}
    </div>
  );
}
