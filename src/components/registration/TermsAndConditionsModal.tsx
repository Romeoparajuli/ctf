import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { termsApi } from "../../api/terms";
import { errorMessage } from "../../hooks/useAsyncData";
import { Alert, Badge, Button, Spinner } from "../ui";
import { formatDate } from "../../utils/format";
import styles from "./TermsAndConditionsModal.module.css";

export interface PreviewTerms {
  title: string;
  version: string;
  renderedHtml: string;
}

export interface TermsAndConditionsModalProps {
  open: boolean;
  /** Live participant mode: fetches and accepts the event's currently active terms. */
  eventId?: number;
  /**
   * Admin preview mode: renders the given terms directly, no fetch, no
   * accept call ever hits the backend — there is nothing to gate, so no
   * checkbox is shown, just a "Close Preview" action. Takes precedence over
   * eventId when both are supplied.
   */
  previewTerms?: PreviewTerms;
  /**
   * Called once acceptance has been successfully persisted on the backend.
   * May perform further async work (e.g. starting the registration); if it
   * throws, the modal stays open and surfaces the error message. Unused in
   * preview mode.
   */
  onAccepted?: () => void | Promise<void>;
  onCancel: () => void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function TermsAndConditionsModal({ open, eventId, previewTerms, onAccepted, onCancel }: TermsAndConditionsModalProps) {
  const isPreview = previewTerms !== undefined;

  // Single source of truth for acceptance — nothing else in this component
  // tracks whether the user has agreed to the terms.
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [terms, setTerms] = useState<{ title: string; version: string; renderedHtml: string } | null>(null);
  const [priorAcceptance, setPriorAcceptance] = useState<{ version: string; accepted_at: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Load terms content + any prior acceptance whenever the modal opens, and
  // reset per-open UI state so a cancelled/reopened modal starts fresh.
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    setSubmitError(null);
    setIsSubmitting(false);
    setLoadError(null);

    if (isPreview) {
      setTerms(previewTerms);
      setPriorAcceptance(null);
      setIsLoading(false);
      return;
    }

    if (!eventId) return;
    setIsLoading(true);

    let cancelled = false;
    Promise.all([termsApi.getActive(eventId), termsApi.getAcceptance(eventId)])
      .then(([activeRes, acceptanceRes]) => {
        if (cancelled) return;
        setTerms({
          title: activeRes.terms.title,
          version: activeRes.terms.version,
          renderedHtml: activeRes.terms.renderedHtml,
        });
        if (acceptanceRes.acceptance) {
          setPriorAcceptance({
            version: acceptanceRes.acceptance.version,
            accepted_at: acceptanceRes.acceptance.accepted_at,
          });
          // Only pre-check the box if the prior acceptance matches the
          // currently active terms version — a version bump requires
          // re-acceptance, so we must not silently carry old consent forward.
          setTermsAccepted(acceptanceRes.acceptance.version === activeRes.terms.version);
        } else {
          setPriorAcceptance(null);
          setTermsAccepted(false);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorMessage(err, "Could not load the terms and conditions."));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, eventId, isPreview]);

  useEffect(() => {
    if (!open) return;

    // Focus the dialog itself first so screen readers announce it, then let
    // the user Tab into its controls.
    dialogRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!isSubmitting) onCancel();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to whatever triggered the modal (the Register Now button).
      previouslyFocused.current?.focus();
    };
  }, [open, isSubmitting, onCancel]);

  if (!open) return null;

  const handleCheckboxChange = (checked: boolean) => {
    setTermsAccepted(checked);
    if (checked) setSubmitError(null);
  };

  const handleAccept = async () => {
    if (isPreview) {
      onCancel();
      return;
    }
    // The button is disabled unless termsAccepted is true, so this should be
    // unreachable in practice — guard anyway rather than trusting the UI alone.
    if (!termsAccepted) {
      setSubmitError("Accept the terms and conditions before continuing.");
      return;
    }
    if (!terms || !eventId || !onAccepted) return;

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await termsApi.accept(eventId);
      await onAccepted();
    } catch (err) {
      setSubmitError(errorMessage(err, "Unable to record your acceptance. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && !isSubmitting && onCancel()}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
        aria-describedby="terms-modal-description"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 id="terms-modal-title" className={styles.title}>
            {terms?.title || "Terms & Conditions"}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <p id="terms-modal-description" className={styles.description}>
          {isPreview
            ? "Preview — this is exactly what participants will see. No acceptance is recorded here."
            : "Please read and accept the event terms before continuing with registration."}
        </p>

        {isPreview && (
          <div style={{ marginBottom: "var(--space-4)" }}>
            <Badge tone="accent">Preview Mode</Badge>
          </div>
        )}

        {loadError && <Alert variant="error">{loadError}</Alert>}
        {submitError && (
          <Alert variant="error" title="Could not continue">
            {submitError}
          </Alert>
        )}

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8) 0" }}>
            <Spinner label="Loading terms" />
          </div>
        ) : (
          terms && (
            <>
              <div className={styles.termsBox} tabIndex={0} dangerouslySetInnerHTML={{ __html: terms.renderedHtml }} />
              <p className={styles.versionNote}>
                Version {terms.version}
                {priorAcceptance &&
                  priorAcceptance.version === terms.version &&
                  ` · You accepted this version on ${formatDate(priorAcceptance.accepted_at)}`}
              </p>

              {!isPreview && (
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => handleCheckboxChange(e.target.checked)}
                  />
                  <span>I have read and accept the terms and conditions.</span>
                </label>
              )}
            </>
          )
        )}

        <div className={styles.actions}>
          {!isPreview && (
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button
            type="button"
            disabled={!isPreview && (!termsAccepted || isLoading || !terms)}
            isLoading={isSubmitting}
            loadingText="Saving…"
            onClick={handleAccept}
          >
            {isPreview ? "Close Preview" : "Accept & Continue"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
