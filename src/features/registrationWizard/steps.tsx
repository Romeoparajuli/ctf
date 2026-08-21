import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Badge, Button, Card, FormField, Input, Textarea } from "../../components/ui";
import { errorMessage } from "../../hooks/useAsyncData";
import { registrationsApi } from "../../api/registrations";
import { paymentsApi } from "../../api/payments";
import { ApiError } from "../../api/client";
import { formatCurrency } from "../../utils/format";
import type { RegistrationFull } from "../../types/domain";
import styles from "./RegistrationWizard.module.css";

interface StepProps {
  data: RegistrationFull;
  onAdvance: () => void;
}

export function TermsStep({ data, onAdvance }: StepProps) {
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await registrationsApi.acceptTerms(data.registration.id);
      onAdvance();
    } catch (err) {
      setError(errorMessage(err, "Could not record your acceptance."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={styles.stepCard}>
      <h2 className={styles.stepTitle}>Terms &amp; Conditions</h2>
      <p className={styles.stepDescription}>Read and accept the event terms before continuing.</p>

      {error && (
        <Alert variant="error" title="Could not continue">
          {error}
        </Alert>
      )}

      <div className={styles.termsBox} tabIndex={0}>
        By registering for {data.event.name} you agree to compete fairly, respect the competition
        infrastructure, and abide by the organizers' decisions. Registration fees are non-refundable once
        payment is verified. Organizers may disqualify teams found violating competition rules.
      </div>

      <label className={styles.checkboxRow}>
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        <span>I have read and accept the terms and conditions.</span>
      </label>

      <div className={styles.actions}>
        <Button onClick={handleContinue} disabled={!accepted} isLoading={isSubmitting} loadingText="Saving…">
          Continue
        </Button>
      </div>
    </Card>
  );
}

export function TeamStep({ data, onAdvance }: StepProps) {
  const [teamName, setTeamName] = useState("");
  const [institution, setInstitution] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await registrationsApi.createTeam(data.registration.id, {
        teamName,
        institution: institution || undefined,
        description: description || undefined,
      });
      onAdvance();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setFieldErrors(err.fieldErrors);
      setError(errorMessage(err, "Could not create the team."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={styles.stepCard}>
      <h2 className={styles.stepTitle}>Create Your Team</h2>
      <p className={styles.stepDescription}>
        You'll be registered as team captain. Team size for this event: {data.event.min_team_size as number}–
        {data.event.max_team_size as number} participants.
      </p>

      {error && (
        <Alert variant="error" title="Could not create team">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <FormField id="teamName" label="Team name" required error={fieldErrors.teamName}>
          {(field) => <Input {...field} value={teamName} onChange={(e) => setTeamName(e.target.value)} required />}
        </FormField>
        <FormField id="institution" label="Institution / Organization" helperText="Optional">
          {(field) => <Input {...field} value={institution} onChange={(e) => setInstitution(e.target.value)} />}
        </FormField>
        <FormField id="description" label="Team description" helperText="Optional">
          {(field) => <Textarea {...field} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />}
        </FormField>
        <div className={styles.actions}>
          <Button type="submit" isLoading={isSubmitting} loadingText="Creating…">
            Continue
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function ParticipantsStep({ data, onAdvance }: StepProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [reloadKey, setReloadKey] = useState(0);
  const [members, setMembers] = useState(data.members);

  const maxSize = data.event.max_team_size as number;
  const minSize = data.event.min_team_size as number;
  const atCapacity = members.length >= maxSize;
  const meetsMinimum = members.length >= minSize;
  const [isAdvancing, setIsAdvancing] = useState(false);

  const handleContinueToPayment = async () => {
    setError(null);
    setIsAdvancing(true);
    try {
      await registrationsApi.proceedToPayment(data.registration.id);
      onAdvance();
    } catch (err) {
      setError(errorMessage(err, "Could not proceed to payment."));
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await registrationsApi.addParticipant(data.registration.id, {
        name,
        email,
        phone: phone || undefined,
        institution: institution || undefined,
        role: "MEMBER",
      });
      setName("");
      setEmail("");
      setPhone("");
      setInstitution("");
      const fresh = await registrationsApi.get(data.registration.id);
      setMembers(fresh.members);
      setReloadKey((k) => k + 1);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setFieldErrors(err.fieldErrors);
      setError(errorMessage(err, "Could not add participant."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (memberId: number) => {
    setError(null);
    try {
      await registrationsApi.removeParticipant(data.registration.id, memberId);
      const fresh = await registrationsApi.get(data.registration.id);
      setMembers(fresh.members);
    } catch (err) {
      setError(errorMessage(err, "Could not remove participant."));
    }
  };

  void reloadKey;

  return (
    <Card className={styles.stepCard}>
      <h2 className={styles.stepTitle}>Team Participants</h2>
      <p className={styles.stepDescription}>
        Add {minSize === maxSize ? minSize : `${minSize}–${maxSize}`} participants total (including yourself as
        captain). {members.length}/{maxSize} added.
      </p>

      {error && (
        <Alert variant="error" title="Could not update participants">
          {error}
        </Alert>
      )}

      <div className={styles.memberList}>
        {members.map((m) => (
          <div key={m.id} className={styles.memberRow}>
            <div className={styles.memberInfo}>
              <span className={styles.memberName}>
                {m.name} {m.role === "CAPTAIN" && <Badge tone="accent">Captain</Badge>}
              </span>
              <span className={styles.memberEmail}>{m.email}</span>
            </div>
            {m.role !== "CAPTAIN" && (
              <Button variant="ghost" onClick={() => handleRemove(m.id)}>
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>

      {!atCapacity && (
        <form onSubmit={handleAdd} className={styles.form} noValidate>
          <div className={styles.row}>
            <FormField id="memberName" label="Full name" required error={fieldErrors.name}>
              {(field) => <Input {...field} value={name} onChange={(e) => setName(e.target.value)} required />}
            </FormField>
            <FormField id="memberEmail" label="Email" required error={fieldErrors.email}>
              {(field) => (
                <Input {...field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              )}
            </FormField>
          </div>
          <div className={styles.row}>
            <FormField id="memberPhone" label="Phone" helperText="Optional">
              {(field) => <Input {...field} value={phone} onChange={(e) => setPhone(e.target.value)} />}
            </FormField>
            <FormField id="memberInstitution" label="Institution" helperText="Optional">
              {(field) => <Input {...field} value={institution} onChange={(e) => setInstitution(e.target.value)} />}
            </FormField>
          </div>
          <div className={styles.actions}>
            <Button type="submit" variant="secondary" isLoading={isSubmitting} loadingText="Adding…">
              Add Participant
            </Button>
          </div>
        </form>
      )}

      <div className={styles.actions}>
        <Button onClick={handleContinueToPayment} disabled={!meetsMinimum} isLoading={isAdvancing} loadingText="Calculating fee…">
          Continue to Payment
        </Button>
      </div>
    </Card>
  );
}

export function PaymentStep({ data, onAdvance }: StepProps) {
  const [reference, setReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await paymentsApi.submit(data.registration.id, { reference });
      onAdvance();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setFieldErrors(err.fieldErrors);
      setError(errorMessage(err, "Could not submit payment."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={styles.stepCard}>
      <h2 className={styles.stepTitle}>Payment</h2>
      <p className={styles.stepDescription}>
        Registration period: <Badge tone={data.registration.registration_period === "EARLY" ? "success" : "warning"}>
          {data.registration.registration_period}
        </Badge>
      </p>

      {error && (
        <Alert variant="error" title="Could not submit payment">
          {error}
        </Alert>
      )}

      <div className={styles.qrWrap}>
        {data.event.payment_qr_url ? (
          <img src={data.event.payment_qr_url as string} alt="PhonePe payment QR code" width={200} height={200} />
        ) : (
          <div style={{ width: 200, height: 200, border: "1px dashed var(--color-border-strong)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-faint)", fontSize: "var(--text-xs)" }}>
            QR code not yet configured
          </div>
        )}
        <p className={styles.amount}>{formatCurrency(data.registration.fee_amount)}</p>
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
          {(data.event.payment_instructions as string) ??
            "Scan the QR code with PhonePe, pay the amount above, then enter the transaction reference below."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <FormField
          id="reference"
          label="Payment transaction reference"
          required
          error={fieldErrors.reference}
          helperText="Found in your PhonePe transaction history."
        >
          {(field) => <Input {...field} value={reference} onChange={(e) => setReference(e.target.value)} required />}
        </FormField>
        <div className={styles.actions}>
          <Button type="submit" isLoading={isSubmitting} loadingText="Submitting…">
            Submit Payment
          </Button>
        </div>
      </form>
    </Card>
  );
}

const STATUS_CHECKLIST: { key: string; label: string }[] = [
  { key: "ACCOUNT", label: "Account Created" },
  { key: "TERMS", label: "Terms Accepted" },
  { key: "TEAM", label: "Team Created" },
  { key: "PARTICIPANTS", label: "Participants Added" },
  { key: "PAYMENT", label: "Payment Verified" },
  { key: "REVIEW", label: "Admin Review" },
  { key: "APPROVED", label: "Registration Approved" },
];

function checklistIndexForStatus(status: string): number {
  switch (status) {
    case "PAYMENT_SUBMITTED":
      return 4;
    case "PAYMENT_VERIFIED":
      return 5;
    case "ADMIN_REVIEW":
      return 5;
    case "APPROVED":
      return 7;
    case "REJECTED":
      return 5;
    default:
      return 4;
  }
}

export function StatusStep({ data }: { data: RegistrationFull }) {
  const doneCount = checklistIndexForStatus(data.registration.status);
  const isRejected = data.registration.status === "REJECTED";

  return (
    <Card className={styles.stepCard}>
      <h2 className={styles.stepTitle}>{isRejected ? "Registration Rejected" : "Registration Submitted"}</h2>
      <p className={styles.stepDescription}>
        {isRejected
          ? "Your registration was not approved. See the reason below."
          : "Your payment is being reviewed. You'll be notified as your registration progresses."}
      </p>

      {isRejected && data.registration.rejection_reason && (
        <Alert variant="error" title="Rejection reason">
          {data.registration.rejection_reason}
        </Alert>
      )}

      <div className={styles.checklist}>
        {STATUS_CHECKLIST.map((item, index) => (
          <div
            key={item.key}
            className={`${styles.checklistItem} ${
              isRejected && index >= 5
                ? styles.checklistPending
                : index < doneCount
                ? styles.checklistDone
                : index === doneCount
                ? styles.checklistCurrent
                : styles.checklistPending
            }`}
          >
            <span aria-hidden="true">{index < doneCount ? "✓" : index === doneCount && !isRejected ? "●" : "○"}</span>
            {item.label}
          </div>
        ))}
      </div>

      <Link to="/dashboard">
        <Button variant="secondary">Back to Dashboard</Button>
      </Link>
    </Card>
  );
}
