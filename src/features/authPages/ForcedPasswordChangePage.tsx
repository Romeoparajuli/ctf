import { FormEvent, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { usersApi } from "../../api/users";
import { errorMessage } from "../../hooks/useAsyncData";
import { ApiError } from "../../api/client";
import { Alert, Button, Card, FormField, PasswordInput } from "../../components/ui";
import styles from "./AuthPages.module.css";

/**
 * Full-page gate rendered instead of the app whenever the authenticated
 * user's password was set by an admin (new account or forced reset). The
 * backend enforces this independently (requireAuth rejects everything
 * except /auth/me, /auth/logout and this form's own endpoint with
 * PASSWORD_CHANGE_REQUIRED) — this page is the UX for that server-side
 * gate, not a substitute for it.
 */
export function ForcedPasswordChangePage() {
  const { user, logout, refresh } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    try {
      await usersApi.changeMyPassword({ currentPassword, newPassword });
      const refreshedUser = await refresh();
      if (refreshedUser?.mustChangePassword) {
        // Should be unreachable — the backend clears the flag on a successful
        // change — but don't leave the user stuck on this page if it happens.
        setFormError("Password changed, but the account still requires a change. Please contact an administrator.");
      }
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setFieldErrors(err.fieldErrors);
      setFormError(errorMessage(err, "Could not change your password."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`container ${styles.wrap}`}>
      <Card className={styles.card}>
        <h1 className={styles.title}>Change your password</h1>
        <p className={styles.subtitle}>
          {user
            ? `Hi ${user.fullName}, your password was set by an administrator. Choose a new one before continuing.`
            : "Choose a new password before continuing."}
        </p>

        {formError && (
          <Alert variant="error" title="Could not change password">
            {formError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <FormField
            id="currentPassword"
            label="Current (temporary) password"
            required
            error={fieldErrors.currentPassword}
          >
            {(field) => (
              <PasswordInput
                {...field}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            )}
          </FormField>

          <FormField id="newPassword" label="New password" required error={fieldErrors.newPassword}>
            {(field) => (
              <PasswordInput {...field} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            )}
          </FormField>

          <FormField id="confirmPassword" label="Confirm new password" required error={fieldErrors.confirmPassword}>
            {(field) => (
              <PasswordInput
                {...field}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            )}
          </FormField>

          <Button type="submit" fullWidth isLoading={isSubmitting} loadingText="Changing password…">
            Change password &amp; continue
          </Button>
        </form>

        <p className={styles.footerNote}>
          Wrong account? <button type="button" onClick={logout} className={styles.linkButton}>Log out</button>.
        </p>
      </Card>
    </div>
  );
}
