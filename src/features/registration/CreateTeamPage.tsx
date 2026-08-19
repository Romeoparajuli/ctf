import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Card, FormField, Input, PasswordInput } from "../../components/ui";
import { TEAM_MAX_SIZE } from "../../services/api/config";
import { AccountFields } from "./AccountFields";
import styles from "./RegistrationForm.module.css";
import { useTeamRegistration } from "./useTeamRegistration";
import {
  AccountFormValues,
  FieldErrors,
  validateAccountFields,
  validateCreateTeamFields,
  validateRequiredCustomFields,
} from "./validation";

const ACCOUNT_INITIAL: AccountFormValues = { name: "", email: "", password: "", confirmPassword: "" };

export function CreateTeamPage() {
  const navigate = useNavigate();
  const { status, formError, fieldErrors: serverErrors, result, teamFields, createTeam, isSubmitting } =
    useTeamRegistration();

  const [account, setAccount] = useState<AccountFormValues>(ACCOUNT_INITIAL);
  const [teamName, setTeamName] = useState("");
  const [teamPassword, setTeamPassword] = useState("");
  const [confirmTeamPassword, setConfirmTeamPassword] = useState("");
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [editedSinceError, setEditedSinceError] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "success" && result) {
      navigate("/register/success", {
        state: { teamName: result.team.name, mode: "created" },
      });
    }
  }, [status, result, navigate]);

  function clearErrorFor(field: string) {
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setEditedSinceError((prev) => new Set(prev).add(field));
  }

  function handleAccountChange(field: keyof AccountFormValues, value: string) {
    setAccount((prev) => ({ ...prev, [field]: value }));
    clearErrorFor(field);
  }

  function handleAccountBlur(field: keyof AccountFormValues) {
    const errors = validateAccountFields({ ...account });
    if (errors[field]) setClientErrors((prev) => ({ ...prev, [field]: errors[field] }));
  }

  function handleCustomChange(id: string, value: string) {
    setCustomValues((prev) => ({ ...prev, [id]: value }));
    clearErrorFor(`custom_${id}`);
  }

  function displayError(field: string): string | undefined {
    if (clientErrors[field]) return clientErrors[field];
    if (!editedSinceError.has(field) && serverErrors[field]) return serverErrors[field];
    return undefined;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const accountErrors = validateAccountFields(account);
    const teamErrors = validateCreateTeamFields({ teamName, teamPassword, confirmTeamPassword });
    const customErrors = validateRequiredCustomFields(teamFields, customValues);
    const allErrors = { ...accountErrors, ...teamErrors, ...customErrors };

    setClientErrors(allErrors);
    setEditedSinceError(new Set());

    if (Object.keys(allErrors).length > 0) return;

    await createTeam(
      { name: account.name.trim(), email: account.email.trim(), password: account.password },
      { teamName: teamName.trim(), password: teamPassword, customFields: customValues }
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.layout}>
        <div className={styles.formColumn}>
          <div className={styles.header}>
            <span className="eyebrow">Create Team</span>
            <h1 className={styles.title}>Set up your team</h1>
            <p className={styles.subtitle}>
              You'll register your competitor account and stand up a new team in one step.
              You become team captain — share the team password with teammates so they can
              join.
            </p>
          </div>

          {formError && status === "error" && (
            <Alert variant="error" title="Couldn't create your team">
              {formError}
            </Alert>
          )}

          <Card>
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeading}>
                  <span className={styles.sectionNumber}>01</span>
                  <h2 className={styles.sectionTitle}>Your account</h2>
                </div>
                <AccountFields
                  values={account}
                  errors={{
                    name: displayError("name") ?? "",
                    email: displayError("email") ?? "",
                    password: displayError("password") ?? "",
                    confirmPassword: displayError("confirmPassword") ?? "",
                  }}
                  onChange={handleAccountChange}
                  onBlur={handleAccountBlur}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.sectionCard}>
                <div className={styles.sectionHeading}>
                  <span className={styles.sectionNumber}>02</span>
                  <h2 className={styles.sectionTitle}>Your team</h2>
                </div>
                <div className={styles.fieldGrid}>
                  <div className={styles.fullSpan}>
                    <FormField
                      id="teamName"
                      label="Team name"
                      error={displayError("teamName")}
                      helperText="This is what appears on the public scoreboard."
                      required
                    >
                      {(field) => (
                        <Input
                          {...field}
                          invalid={Boolean(displayError("teamName"))}
                          value={teamName}
                          onChange={(e) => {
                            setTeamName(e.target.value);
                            clearErrorFor("teamName");
                          }}
                          onBlur={() => {
                            const errors = validateCreateTeamFields({
                              teamName,
                              teamPassword,
                              confirmTeamPassword,
                            });
                            if (errors.teamName)
                              setClientErrors((prev) => ({ ...prev, teamName: errors.teamName }));
                          }}
                          placeholder="e.g. CYBER PHANTOMS"
                          disabled={isSubmitting}
                        />
                      )}
                    </FormField>
                  </div>

                  <FormField
                    id="teamPassword"
                    label="Team password"
                    error={displayError("teamPassword")}
                    helperText="Shared with teammates so they can join."
                    required
                  >
                    {(field) => (
                      <PasswordInput
                        {...field}
                        invalid={Boolean(displayError("teamPassword"))}
                        value={teamPassword}
                        onChange={(e) => {
                          setTeamPassword(e.target.value);
                          clearErrorFor("teamPassword");
                        }}
                        placeholder="At least 8 characters"
                        disabled={isSubmitting}
                      />
                    )}
                  </FormField>

                  <FormField
                    id="confirmTeamPassword"
                    label="Confirm team password"
                    error={displayError("confirmTeamPassword")}
                    required
                  >
                    {(field) => (
                      <PasswordInput
                        {...field}
                        invalid={Boolean(displayError("confirmTeamPassword"))}
                        value={confirmTeamPassword}
                        onChange={(e) => {
                          setConfirmTeamPassword(e.target.value);
                          clearErrorFor("confirmTeamPassword");
                        }}
                        placeholder="Re-enter the team password"
                        disabled={isSubmitting}
                      />
                    )}
                  </FormField>

                  {teamFields.map((field) => (
                    <div key={field.id} className={field.type === "text" ? "" : styles.fullSpan}>
                      <FormField
                        id={`custom_${field.id}`}
                        label={field.name}
                        error={displayError(`custom_${field.id}`)}
                        helperText={field.helperText}
                        required={field.required}
                      >
                        {(f) => (
                          <Input
                            {...f}
                            invalid={Boolean(displayError(`custom_${field.id}`))}
                            value={customValues[field.id] ?? ""}
                            onChange={(e) => handleCustomChange(field.id, e.target.value)}
                            disabled={isSubmitting}
                          />
                        )}
                      </FormField>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.actions}>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Creating Team..."
                  fullWidth
                >
                  Create Team
                </Button>
              </div>

              <p className={styles.switchLink}>
                Already have team credentials? <Link to="/register/join">Join a team instead</Link>
              </p>
            </form>
          </Card>
        </div>

        <aside className={styles.aside}>
          <span className={styles.asideTitle}>Good to know</span>
          <ul className={styles.asideList}>
            <li>
              <span aria-hidden="true">→</span>
              <span>
                <strong>You're the captain.</strong> Whoever creates the team can share its
                password with up to {TEAM_MAX_SIZE - 1} teammates.
              </span>
            </li>
            <li>
              <span aria-hidden="true">→</span>
              <span>
                <strong>Team names are public.</strong> They'll show on the live scoreboard —
                pick something you're fine competing under.
              </span>
            </li>
            <li>
              <span aria-hidden="true">→</span>
              <span>
                <strong>Your password stays private.</strong> We never store it in your
                browser or log it anywhere.
              </span>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
