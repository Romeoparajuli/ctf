import { FormEvent, useState } from "react";
import { termsApi, type TermsRecord } from "../../../api/terms";
import { errorMessage } from "../../../hooks/useAsyncData";
import { ApiError } from "../../../api/client";
import { Alert, Button, FormField, Input, Modal, Select } from "../../../components/ui";
import type { EventSummary } from "../../../types/domain";
import styles from "./Terms.module.css";

export interface TermsFormModalProps {
  /** Present when editing an existing DRAFT; absent when creating a new one. */
  existing?: TermsRecord;
  events: EventSummary[];
  defaultEventId?: number;
  canPublish: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function TermsFormModal({ existing, events, defaultEventId, canPublish, onClose, onSaved }: TermsFormModalProps) {
  const [eventId, setEventId] = useState<number | "">(existing?.event_id ?? defaultEventId ?? "");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [version, setVersion] = useState(existing?.version ?? "1.0");
  const [content, setContent] = useState(existing?.content ?? "");
  const [effectiveDate, setEffectiveDate] = useState(existing?.effective_date?.slice(0, 10) ?? "");
  const [publishNow, setPublishNow] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!eventId) {
      setFieldErrors({ eventId: "Select an event." });
      return;
    }
    setIsSaving(true);
    try {
      if (existing) {
        await termsApi.update(existing.id, { title, content, effectiveDate: effectiveDate || undefined });
      } else {
        await termsApi.create({
          eventId: Number(eventId),
          title,
          version,
          content,
          effectiveDate: effectiveDate || undefined,
          publish: publishNow,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setFieldErrors(err.fieldErrors);
      setError(errorMessage(err, "Could not save these terms."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open
      title={existing ? `Edit Terms — ${existing.title}` : "Create Terms & Conditions"}
      onClose={onClose}
      busy={isSaving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSaving} loadingText="Saving…">
            {publishNow && !existing ? "Save & Publish" : "Save Draft"}
          </Button>
        </>
      }
    >
      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.row}>
          <FormField id="termsEvent" label="Event" required error={fieldErrors.eventId}>
            {(field) => (
              <Select
                {...field}
                value={eventId}
                onChange={(e) => setEventId(e.target.value ? Number(e.target.value) : "")}
                disabled={!!existing}
                required
              >
                <option value="">Select event…</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField id="termsVersion" label="Version" required helperText={existing ? "Version cannot be changed once created." : "e.g. 1.0"}>
            {(field) => (
              <Input {...field} value={version} onChange={(e) => setVersion(e.target.value)} disabled={!!existing} required />
            )}
          </FormField>
        </div>

        <FormField id="termsTitle" label="Title" required error={fieldErrors.title}>
          {(field) => <Input {...field} value={title} onChange={(e) => setTitle(e.target.value)} required />}
        </FormField>

        <FormField id="termsEffectiveDate" label="Effective Date" helperText="Optional — leave blank to take effect immediately once published.">
          {(field) => <Input {...field} type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />}
        </FormField>

        <FormField id="termsContent" label="Content" required error={fieldErrors.content}>
          {(field) => (
            <textarea
              {...field}
              className={styles.contentEditor}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          )}
        </FormField>
        <p className={styles.editorHint}>
          Markdown supported: # heading, **bold**, *italic*, - list item, 1. numbered item, &gt; blockquote, --- divider,
          [link](https://…). Rendered as sanitized HTML — no raw HTML or scripts are ever stored or shown.
        </p>

        {!existing && canPublish && (
          <label className={styles.statusChoice}>
            <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
            Publish immediately (archives the event's currently published version, if any)
          </label>
        )}
      </form>
    </Modal>
  );
}
