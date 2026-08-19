import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Card, FormField, Input, PasswordInput } from "../../components/ui";
import { USE_MOCK_API } from "../../services/api/config";
import { AccountFields } from "./AccountFields";
import styles from "./RegistrationForm.module.css";
import { useTeamRegistration } from "./useTeamRegistration";
import {
  AccountFormValues,
  FieldErrors,
  validateAccountFields,
  validateJoinTeamFields,
} from "./validation";

const ACCOUNT_INITIAL: AccountFormValues = { name: "", email: "", password: "", confirmPassword: "" };

export function JoinTeamPage() {
  const navigate = useNavigate();
  const { status, formError, fieldErrors: serverErrors, result, joinTeam, isSubmitting } =
    useTeamRegistration();

  const [account, setAccount] = useState<AccountFormValues>(ACCOUNT_INITIAL);
  const [teamName, setTeamName] = useState("");
  const [teamPassword, setTeamPassword] = useState("");

  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [editedSinceError, setEditedSinceError] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "success" && result) {
      navigate("/register/success", {
        state: { teamName: result.team.name, mode: "joined" },
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

  function displayError(field: string): string | undefined {
    if (clientErrors[field]) return clientErrors[field];
    if (!editedSinceError.has(field) && serverErrors[field]) return serverErrors[field];
    return undefined;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const accountErrors = validateAccountFields(account);
    const joinErrors = validateJoinTeamFields({ teamName, teamPassword });
    const allErrors = { ...accountErrors, ...joinErrors };

    setClientErrors(allErrors);
    setEditedSinceError(new Set());

    if (Object.keys(allErrors).length > 0) return;

    await joinTeam(
      { name: account.name.trim(), email: account.email.trim(), password: account.password },
      { teamName: teamName.trim(), password: teamPassword }
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.layout}>
        <div className={styles.formColumn}>
          <div className={styles.header}>
            <span className="eyebrow">Join Team</span>
            <h1 className={styles.title}>Join an existing team</h1>
            <p className={styles.subtitle}>
              Get the team name and password from your captain, register your account, and
              you'll be added as a member immediately.
            </p>
          </div>

          {formError && status === "error" && (
            <Alert variant="error" title="Couldn't join that team">
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
                  <h2 className={styles.sectionTitle}>Team credentials</h2>
                </div>
                <div className={styles.fieldGrid}>
                  <FormField
                    id="teamName"
                    label="Team name"
                    error={displayError("teamName")}
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
                          const errors = validateJoinTeamFields({ teamName, teamPassword });
                          if (errors.teamName)
                            setClientErrors((prev) => ({ ...prev, teamName: errors.teamName }));
                        }}
                        placeholder="e.g. CYBER PHANTOMS"
                        disabled={isSubmitting}
                      />
                    )}
                  </FormField>

                  <FormField
                    id="teamPassword"
                    label="Team password"
                    error={displayError("teamPassword")}
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
                        placeholder="Shared by your captain"
                        disabled={isSubmitting}
                      />
                    )}
                  </FormField>
                </div>
              </div>

              <div className={styles.actions}>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Joining Team..."
                  fullWidth
                >
                  Join Team
                </Button>
              </div>

              <p className={styles.switchLink}>
                Don't have a team yet? <Link to="/register/create">Create one instead</Link>
              </p>
            </form>
          </Card>
        </div>

        <aside className={styles.aside}>
          <span className={styles.asideTitle}>{USE_MOCK_API ? "Try the demo" : "Good to know"}</span>
          <ul className={styles.asideList}>
            {USE_MOCK_API && (
              <li>
                <span aria-hidden="true">→</span>
                <span>
                  A seed team already exists in this environment: <strong>CYBER PHANTOMS</strong>{" "}
                  / password <strong>letmein123</strong>.
                </span>
              </li>
            )}
            <li>
              <span aria-hidden="true">→</span>
              <span>Wrong password, an unknown team name, or a full team all surface clear, specific errors.</span>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
