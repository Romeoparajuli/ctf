import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { getDefaultRoute } from "../../auth/roleRouting";
import { errorMessage } from "../../hooks/useAsyncData";
import { Alert, Button, Card, FormField, Input } from "../../components/ui";
import styles from "./AuthPages.module.css";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const loggedInUser = await login({ email, password });
      navigate(getDefaultRoute(loggedInUser), { replace: true });
    } catch (err) {
      setFormError(errorMessage(err, "Login failed. Try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`container ${styles.wrap}`}>
      <Card className={styles.card}>
        <h1 className={styles.title}>Log in</h1>
        <p className={styles.subtitle}>Access your Nepal CTF registration dashboard.</p>

        {formError && (
          <Alert variant="error" title="Login failed">
            {formError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <FormField id="email" label="Email address" required>
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

          <FormField id="password" label="Password" required>
            {(field) => (
              <Input
                {...field}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}
          </FormField>

          <Button type="submit" fullWidth isLoading={isSubmitting} loadingText="Logging in…">
            Log in
          </Button>
        </form>

        <p className={styles.footerNote}>
          Don't have an account? <Link to="/signup">Register here</Link>.
        </p>
      </Card>
    </div>
  );
}
