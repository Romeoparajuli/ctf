import { FormEvent, useState } from "react";
import { errorMessage, useAsyncData } from "../../hooks/useAsyncData";
import { eventsApi, EventInput } from "../../api/events";
import { Alert, Badge, Button, Card, FormField, Input, Select, StatusBadge, Textarea } from "../../components/ui";
import { formatCurrency } from "../../utils/format";
import styles from "./Admin.module.css";

const EMPTY_FORM: EventInput = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  rules: "",
  prizePool: "",
  venue: "",
  registrationStartDate: "",
  earlyRegistrationEndDate: "",
  lateRegistrationEndDate: "",
  earlyRegistrationFee: 5000,
  lateRegistrationFee: 7000,
  paymentInstructions: "",
  paymentQr: "",
  minTeamSize: 1,
  maxTeamSize: 4,
};

function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EVENT_STATUSES = ["DRAFT", "PUBLISHED", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "ONGOING", "COMPLETED", "CANCELLED"];

export function EventsPage() {
  const { data, isLoading, error, refetch } = useAsyncData(() => eventsApi.list(), []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EventInput>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const startEdit = (id: number) => {
    const event = data?.items.find((e) => e.id === id);
    if (!event) return;
    setEditingId(id);
    setForm({
      name: event.name,
      slug: event.slug,
      description: event.description ?? "",
      shortDescription: event.shortDescription ?? "",
      rules: event.rules ?? "",
      prizePool: event.prizePool ?? "",
      venue: event.venue ?? "",
      registrationStartDate: toLocalInput(event.registrationStartDate),
      earlyRegistrationEndDate: toLocalInput(event.earlyRegistrationEndDate),
      lateRegistrationEndDate: toLocalInput(event.lateRegistrationEndDate),
      earlyRegistrationFee: event.earlyRegistrationFee,
      lateRegistrationFee: event.lateRegistrationFee,
      paymentInstructions: event.paymentInstructions ?? "",
      paymentQr: event.paymentQr ?? "",
      minTeamSize: event.minTeamSize,
      maxTeamSize: event.maxTeamSize,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);
    try {
      if (editingId) {
        const { slug, ...patch } = form;
        void slug;
        await eventsApi.update(editingId, patch);
      } else {
        await eventsApi.create(form);
      }
      setShowForm(false);
      refetch();
    } catch (err) {
      setFormError(errorMessage(err, "Could not save event."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await eventsApi.update(id, { status });
      refetch();
    } catch (err) {
      setFormError(errorMessage(err, "Could not update status."));
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Events</h1>
          <p className={styles.subtitle}>Configure events without touching source code.</p>
        </div>
        <Button onClick={startCreate}>New Event</Button>
      </div>

      {(error || formError) && <Alert variant="error">{error ?? formError}</Alert>}

      {showForm && (
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>{editingId ? "Edit Event" : "Create Event"}</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.filters}>
              <FormField id="name" label="Event name" required>
                {(field) => (
                  <Input {...field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                )}
              </FormField>
              <FormField id="slug" label="Slug" required helperText={editingId ? "Cannot be changed" : undefined}>
                {(field) => (
                  <Input
                    {...field}
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    disabled={!!editingId}
                    required
                  />
                )}
              </FormField>
              <FormField id="venue" label="Venue">
                {(field) => <Input {...field} value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />}
              </FormField>
              <FormField id="prizePool" label="Prize pool">
                {(field) => (
                  <Input {...field} value={form.prizePool} onChange={(e) => setForm({ ...form, prizePool: e.target.value })} />
                )}
              </FormField>
            </div>

            <FormField id="shortDescription" label="Short description">
              {(field) => (
                <Input
                  {...field}
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                />
              )}
            </FormField>
            <FormField id="description" label="Full description">
              {(field) => (
                <Textarea {...field} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              )}
            </FormField>
            <FormField id="rules" label="Rules">
              {(field) => <Textarea {...field} rows={3} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} />}
            </FormField>

            <div className={styles.filters}>
              <FormField id="registrationStartDate" label="Registration start" required>
                {(field) => (
                  <Input
                    {...field}
                    type="datetime-local"
                    value={form.registrationStartDate}
                    onChange={(e) => setForm({ ...form, registrationStartDate: e.target.value })}
                    required
                  />
                )}
              </FormField>
              <FormField id="earlyRegistrationEndDate" label="Early registration ends" required>
                {(field) => (
                  <Input
                    {...field}
                    type="datetime-local"
                    value={form.earlyRegistrationEndDate}
                    onChange={(e) => setForm({ ...form, earlyRegistrationEndDate: e.target.value })}
                    required
                  />
                )}
              </FormField>
              <FormField id="lateRegistrationEndDate" label="Late registration ends" required>
                {(field) => (
                  <Input
                    {...field}
                    type="datetime-local"
                    value={form.lateRegistrationEndDate}
                    onChange={(e) => setForm({ ...form, lateRegistrationEndDate: e.target.value })}
                    required
                  />
                )}
              </FormField>
            </div>

            <div className={styles.filters}>
              <FormField id="earlyRegistrationFee" label="Early fee (NPR)" required>
                {(field) => (
                  <Input
                    {...field}
                    type="number"
                    min={0}
                    value={form.earlyRegistrationFee}
                    onChange={(e) => setForm({ ...form, earlyRegistrationFee: Number(e.target.value) })}
                    required
                  />
                )}
              </FormField>
              <FormField id="lateRegistrationFee" label="Late fee (NPR)" required>
                {(field) => (
                  <Input
                    {...field}
                    type="number"
                    min={0}
                    value={form.lateRegistrationFee}
                    onChange={(e) => setForm({ ...form, lateRegistrationFee: Number(e.target.value) })}
                    required
                  />
                )}
              </FormField>
              <FormField id="minTeamSize" label="Min team size" required>
                {(field) => (
                  <Input
                    {...field}
                    type="number"
                    min={1}
                    value={form.minTeamSize}
                    onChange={(e) => setForm({ ...form, minTeamSize: Number(e.target.value) })}
                    required
                  />
                )}
              </FormField>
              <FormField id="maxTeamSize" label="Max team size" required>
                {(field) => (
                  <Input
                    {...field}
                    type="number"
                    min={1}
                    value={form.maxTeamSize}
                    onChange={(e) => setForm({ ...form, maxTeamSize: Number(e.target.value) })}
                    required
                  />
                )}
              </FormField>
            </div>

            <FormField id="paymentInstructions" label="Payment instructions">
              {(field) => (
                <Textarea
                  {...field}
                  rows={2}
                  value={form.paymentInstructions}
                  onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })}
                />
              )}
            </FormField>
            <FormField id="paymentQr" label="Payment QR image URL" helperText="PhonePe QR code image URL">
              {(field) => (
                <Input {...field} value={form.paymentQr} onChange={(e) => setForm({ ...form, paymentQr: e.target.value })} />
              )}
            </FormField>

            <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
              <Button type="submit" isLoading={isSaving}>
                {editingId ? "Save changes" : "Create event"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!isLoading && data && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Registration</th>
                <th>Current fee</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((event) => (
                <tr key={event.id}>
                  <td>{event.name}</td>
                  <td>
                    <StatusBadge status={event.status} />
                  </td>
                  <td>
                    <Badge tone={event.registrationState === "CLOSED" ? "neutral" : "success"}>
                      {event.registrationState}
                    </Badge>
                  </td>
                  <td>{event.currentFee !== null ? formatCurrency(event.currentFee) : "—"}</td>
                  <td className={styles.rowActions}>
                    <button onClick={() => startEdit(event.id)}>Edit</button>
                    <Select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) handleStatusChange(event.id, e.target.value);
                        e.target.value = "";
                      }}
                      aria-label={`Change status for ${event.name}`}
                    >
                      <option value="">Change status…</option>
                      {EVENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
