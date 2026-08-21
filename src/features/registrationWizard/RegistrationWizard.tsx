import { useParams } from "react-router-dom";
import { useAsyncData } from "../../hooks/useAsyncData";
import { registrationsApi } from "../../api/registrations";
import { Alert, Spinner, Stepper } from "../../components/ui";
import type { StepperStep } from "../../components/ui";
import { ParticipantsStep, PaymentStep, StatusStep, TeamStep, TermsStep } from "./steps";
import styles from "./RegistrationWizard.module.css";

const STEPS: StepperStep[] = [
  { key: "terms", label: "Terms" },
  { key: "team", label: "Team" },
  { key: "participants", label: "Participants" },
  { key: "payment", label: "Payment" },
  { key: "review", label: "Review" },
  { key: "submitted", label: "Submitted" },
];

function stepIndexForStatus(status: string): number {
  switch (status) {
    case "DRAFT":
      return 0;
    case "TERMS_ACCEPTED":
      return 1;
    case "TEAM_CREATED":
      return 2;
    case "PARTICIPANTS_ADDED":
      return 2;
    case "PAYMENT_PENDING":
      return 3;
    case "PAYMENT_SUBMITTED":
    case "PAYMENT_VERIFIED":
    case "ADMIN_REVIEW":
    case "APPROVED":
    case "REJECTED":
    case "CANCELLED":
      return 5;
    default:
      return 0;
  }
}

export function RegistrationWizard() {
  const { eventId } = useParams<{ eventId: string }>();
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
  const stepIndex = stepIndexForStatus(registration.registration.status);

  let stepContent;
  switch (stepIndex) {
    case 0:
      stepContent = <TermsStep data={registration} onAdvance={refetch} />;
      break;
    case 1:
      stepContent = <TeamStep data={registration} onAdvance={refetch} />;
      break;
    case 2:
      stepContent = <ParticipantsStep data={registration} onAdvance={refetch} />;
      break;
    case 3:
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
