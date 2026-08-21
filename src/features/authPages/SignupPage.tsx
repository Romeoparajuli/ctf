import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { errorMessage } from "../../hooks/useAsyncData";
import { ApiError } from "../../api/client";
import { Alert, Button, Card, FormField, Input, PasswordInput } from "../../components/ui";
import styles from "./AuthPages.module.css";

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await signup({ fullName, email, phone: phone || undefined, password, confirmPassword });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
      setFormError(errorMessage(err, "Could not create your account."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`container ${styles.wrap}`}>
      <Card className={styles.card}>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Register to compete in Nepal CTF.</p>

        {formError && (
          <Alert variant="error" title="Sign up failed">
            {formError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <FormField id="fullName" label="Full name" required error={fieldErrors.fullName}>
            {(field) => (
              <Input {...field} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            )}
          </FormField>

          <FormField id="email" label="Email address" required error={fieldErrors.email}>
            {(field) => (
              <Input
                {...field}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            )}
          </FormField>

          <FormField id="phone" label="Phone number" helperText="Optional" error={fieldErrors.phone}>
            {(field) => (
              <Input {...field} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            )}
          </FormField>

          <div className={styles.row}>
            <FormField id="password" label="Password" required error={fieldErrors.password}>
              {(field) => (
                <PasswordInput
                  {...field}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              )}
            </FormField>

            <FormField id="confirmPassword" label="Confirm password" required error={fieldErrors.confirmPassword}>
              {(field) => (
                <PasswordInput
                  {...field}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              )}
            </FormField>
          </div>

          <Button type="submit" fullWidth isLoading={isSubmitting} loadingText="Creating account…">
            Create account
          </Button>
        </form>

        <p className={styles.footerNote}>
          Already registered? <Link to="/login">Log in</Link>.
        </p>
      </Card>
    </div>
  );
}
