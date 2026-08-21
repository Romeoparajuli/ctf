import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { errorMessage, useAsyncData } from "../../hooks/useAsyncData";
import { registrationsApi } from "../../api/registrations";
import { paymentsApi } from "../../api/payments";
import { useAuth } from "../../auth/AuthContext";
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  FormField,
  Spinner,
  StatusBadge,
  Textarea,
} from "../../components/ui";
import { formatCurrency, formatDate } from "../../utils/format";
import styles from "./Admin.module.css";

export function RegistrationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const registrationId = Number(id);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const { data, isLoading, error, refetch } = useAsyncData(() => registrationsApi.get(registrationId), [registrationId]);

  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [paymentActionError, setPaymentActionError] = useState<string | null>(null);
  const [showPaymentReject, setShowPaymentReject] = useState(false);
  const [paymentRejectReason, setPaymentRejectReason] = useState("");

  if (isLoading) return <Spinner label="Loading registration" />;
  if (error || !data) return <Alert variant="error">{error ?? "Registration not found."}</Alert>;

  const { registration, event, team, members, payment, termsAcceptance, statusHistory, applicant } = data;

  const handleApprove = async () => {
    setActionError(null);
    setIsSubmitting(true);
    try {
      await registrationsApi.approve(registrationId);
      setConfirmApprove(false);
      await refetch();
    } catch (err) {
      setActionError(errorMessage(err, "Could not approve registration."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setActionError(null);
    setIsSubmitting(true);
    try {
      await registrationsApi.reject(registrationId, rejectReason);
      setShowRejectForm(false);
      setRejectReason("");
      await refetch();
    } catch (err) {
      setActionError(errorMessage(err, "Could not reject registration."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!payment) return;
    setPaymentActionError(null);
    setIsSubmitting(true);
    try {
      await paymentsApi.verify(payment.id);
      await refetch();
    } catch (err) {
      setPaymentActionError(errorMessage(err, "Could not verify payment."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!payment) return;
    setPaymentActionError(null);
    setIsSubmitting(true);
    try {
      await paymentsApi.reject(payment.id, paymentRejectReason);
      setShowPaymentReject(false);
      setPaymentRejectReason("");
      await refetch();
    } catch (err) {
      setPaymentActionError(errorMessage(err, "Could not reject payment."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canReviewPayment = payment && ["SUBMITTED", "UNDER_REVIEW"].includes(payment.status) && hasPermission("payments.verify");
  const canDecideRegistration = registration.status === "ADMIN_REVIEW" && hasPermission("registrations.approve");

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>
            REG-{String(registration.id).padStart(4, "0")} · {team?.name ?? "Untitled team"}
          </h1>
          <p className={styles.subtitle}>{event.name}</p>
        </div>
        <StatusBadge status={registration.status} />
      </div>

      <div className={styles.detailGrid}>
        <div>
          <Card className={styles.section}>
            <h2 className={styles.sectionTitle}>Team Information</h2>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Team name</span>
              <span>{team?.name ?? "—"}</span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Captain</span>
              <span>{applicant.full_name}</span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Institution</span>
              <span>{team?.institution ?? "—"}</span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Contact</span>
              <span>
                {applicant.email} {applicant.phone ? `· ${applicant.phone}` : ""}
              </span>
            </div>
          </Card>

          <Card className={styles.section}>
            <h2 className={styles.sectionTitle}>Participants ({members.length})</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Institution</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td>{m.email}</td>
                      <td>{m.role === "CAPTAIN" ? <Badge tone="accent">Captain</Badge> : "Member"}</td>
                      <td>{m.institution ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className={styles.section}>
            <h2 className={styles.sectionTitle}>Terms Acceptance</h2>
            {termsAcceptance ? (
              <>
                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>Version</span>
                  <span>{termsAcceptance.version}</span>
                </div>
                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>Accepted at</span>
                  <span>{formatDate(termsAcceptance.accepted_at)}</span>
                </div>
              </>
            ) : (
              <Badge tone="warning">Not accepted</Badge>
            )}
          </Card>

          <Card className={styles.section}>
            <h2 className={styles.sectionTitle}>Payment</h2>
            {paymentActionError && <Alert variant="error">{paymentActionError}</Alert>}
            {payment ? (
              <>
                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>Expected amount</span>
                  <span>{formatCurrency(payment.amount)}</span>
                </div>
                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>Reference</span>
                  <span>{payment.reference ?? "—"}</span>
                </div>
                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>Status</span>
                  <StatusBadge status={payment.status} />
                </div>
                {payment.rejection_reason && (
                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>Rejection reason</span>
                    <span>{payment.rejection_reason}</span>
                  </div>
                )}
                {canReviewPayment && (
                  <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                    <Button onClick={handleVerifyPayment} isLoading={isSubmitting}>
                      Verify Payment
                    </Button>
                    <Button variant="danger" onClick={() => setShowPaymentReject(true)}>
                      Reject Payment
                    </Button>
                  </div>
                )}
                {showPaymentReject && (
                  <div style={{ marginTop: "var(--space-4)" }}>
                    <FormField id="paymentRejectReason" label="Rejection reason" required>
                      {(field) => (
                        <Textarea
                          {...field}
                          rows={3}
                          value={paymentRejectReason}
                          onChange={(e) => setPaymentRejectReason(e.target.value)}
                        />
                      )}
                    </FormField>
                    <div style={{ display: "flex", gap: "var(--space-3)" }}>
                      <Button
                        variant="danger"
                        onClick={handleRejectPayment}
                        disabled={paymentRejectReason.trim().length < 5}
                        isLoading={isSubmitting}
                      >
                        Confirm Rejection
                      </Button>
                      <Button variant="secondary" onClick={() => setShowPaymentReject(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Badge>No payment record yet</Badge>
            )}
          </Card>

          <Card className={styles.section}>
            <h2 className={styles.sectionTitle}>Status History</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>When</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {statusHistory.map((h) => (
                    <tr key={h.id}>
                      <td>{h.from_status ?? "—"}</td>
                      <td>{h.to_status}</td>
                      <td>{formatDate(h.created_at)}</td>
                      <td>{h.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div>
          <Card className={styles.section}>
            <h2 className={styles.sectionTitle}>Decision</h2>
            {actionError && <Alert variant="error">{actionError}</Alert>}
            {registration.status === "APPROVED" && <Alert variant="success">This registration is approved.</Alert>}
            {registration.status === "REJECTED" && (
              <Alert variant="error">Rejected: {registration.rejection_reason}</Alert>
            )}
            {!canDecideRegistration && registration.status !== "APPROVED" && registration.status !== "REJECTED" && (
              <Alert variant="info">
                This registration must reach Admin Review (payment verified) before it can be decided.
              </Alert>
            )}
            {canDecideRegistration && (
              <>
                <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                  <Button onClick={() => setConfirmApprove(true)}>Approve</Button>
                  <Button variant="danger" onClick={() => setShowRejectForm(true)}>
                    Reject
                  </Button>
                </div>
                {showRejectForm && (
                  <div>
                    <FormField id="rejectReason" label="Rejection reason" required>
                      {(field) => (
                        <Textarea {...field} rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                      )}
                    </FormField>
                    <div style={{ display: "flex", gap: "var(--space-3)" }}>
                      <Button
                        variant="danger"
                        onClick={handleReject}
                        disabled={rejectReason.trim().length < 5}
                        isLoading={isSubmitting}
                      >
                        Confirm Rejection
                      </Button>
                      <Button variant="secondary" onClick={() => setShowRejectForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
            <div style={{ marginTop: "var(--space-4)" }}>
              <Button variant="ghost" onClick={() => navigate("/admin/registrations")}>
                Back to queue
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmApprove}
        title="Approve this registration?"
        description={`This will confirm ${team?.name ?? "this team"}'s registration for ${event.name}.`}
        confirmLabel="Approve"
        isLoading={isSubmitting}
        onConfirm={handleApprove}
        onCancel={() => setConfirmApprove(false)}
      />
    </div>
  );
}
