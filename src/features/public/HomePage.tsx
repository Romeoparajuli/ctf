import { useAsyncData } from "../../hooks/useAsyncData";
import { eventsApi } from "../../api/events";
import { useAuth } from "../../auth/AuthContext";
import { hasAdminAccess } from "../../auth/roleRouting";
import { Alert, Spinner } from "../../components/ui";
import { HeroSection } from "./sections/HeroSection";
import { EventSnapshotSection } from "./sections/EventSnapshotSection";
import { RegistrationSection } from "./sections/RegistrationSection";
import { AboutSection } from "./sections/AboutSection";
import { WhyCyberShieldSection } from "./sections/WhyCyberShieldSection";
import { CompetitionFormatSection } from "./sections/CompetitionFormatSection";
import { ChallengeAreasSection } from "./sections/ChallengeAreasSection";
import { ParticipantSection } from "./sections/ParticipantSection";
import { RulesSection } from "./sections/RulesSection";
import { ImportantDatesSection } from "./sections/ImportantDatesSection";
import { OrganizerSection } from "./sections/OrganizerSection";
import { FinalCtaSection } from "./sections/FinalCtaSection";

export function HomePage() {
  const { user } = useAuth();
  const isStaff = hasAdminAccess(user);

  const { data, isLoading, error } = useAsyncData(() => eventsApi.list(), []);
  const event = data?.items[0];

  if (isLoading) {
    return (
      <div className="container" style={{ padding: "var(--space-16) 0", display: "flex", justifyContent: "center" }}>
        <Spinner label="Loading event" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingBlock: "var(--space-16)" }}>
        <Alert variant="error" title="Could not load the event">
          {error}
        </Alert>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container" style={{ paddingBlock: "var(--space-16)" }}>
        <Alert variant="info" title="No event published yet">
          Check back soon — event details will appear here once published.
        </Alert>
      </div>
    );
  }

  const canRegister = event.registrationState === "EARLY" || event.registrationState === "LATE";

  return (
    <div>
      <HeroSection event={event} user={user} isStaff={isStaff} canRegister={canRegister} />
      <EventSnapshotSection event={event} />
      <RegistrationSection event={event} user={user} isStaff={isStaff} canRegister={canRegister} />
      <AboutSection event={event} />
      <WhyCyberShieldSection />
      <CompetitionFormatSection />
      <ChallengeAreasSection />
      <ParticipantSection />
      <RulesSection event={event} />
      <ImportantDatesSection event={event} />
      <OrganizerSection />
      <FinalCtaSection event={event} user={user} isStaff={isStaff} canRegister={canRegister} />
    </div>
  );
}
