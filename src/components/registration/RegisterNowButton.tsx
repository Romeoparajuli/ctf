import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { registrationsApi } from "../../api/registrations";
import { Button } from "../ui";
import type { ButtonProps } from "../ui";
import { TermsAndConditionsModal } from "./TermsAndConditionsModal";

export interface RegisterNowButtonProps extends Omit<ButtonProps, "onClick" | "children"> {
  eventId: number;
  children?: ReactNode;
}

/**
 * Encapsulates the full "Register Now" gesture: opens the Terms & Conditions
 * modal, persists acceptance, ensures a registration exists and has moved
 * past TERMS_ACCEPTED, then navigates into the registration wizard. Terms
 * are a pre-registration gate, not a wizard step — this is the only place
 * that boundary is crossed.
 */
export function RegisterNowButton({ eventId, children, ...buttonProps }: RegisterNowButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = () => {
    if (!user) {
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    setModalOpen(true);
  };

  const handleAccepted = async () => {
    try {
      const mine = await registrationsApi.mine(eventId);
      const registrationId = mine.registration
        ? mine.registration.registration.id
        : (await registrationsApi.start(eventId)).registration.id;

      // No-op if the registration has already moved past DRAFT.
      await registrationsApi.acceptTerms(registrationId);

      setModalOpen(false);
      navigate(`/register/${eventId}`);
    } catch {
      throw new Error("Unable to start registration. Please refresh the page and try again.");
    }
  };

  return (
    <>
      <Button {...buttonProps} onClick={handleClick}>
        {children ?? "Register Now"}
      </Button>
      <TermsAndConditionsModal
        open={modalOpen}
        eventId={eventId}
        onAccepted={handleAccepted}
        onCancel={() => setModalOpen(false)}
      />
    </>
  );
}
