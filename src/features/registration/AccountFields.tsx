import { FormField, Input, PasswordInput } from "../../components/ui";
import { AccountFormValues, FieldErrors } from "./validation";
import styles from "./RegistrationForm.module.css";

export interface AccountFieldsProps {
  values: AccountFormValues;
  errors: FieldErrors;
  disabled?: boolean;
  onChange: (field: keyof AccountFormValues, value: string) => void;
  onBlur: (field: keyof AccountFormValues) => void;
}

/** Shared "your account" fields used by both Create Team and Join Team — every participant needs a CTFd user account before they can create or join a team. */
export function AccountFields({ values, errors, disabled, onChange, onBlur }: AccountFieldsProps) {
  return (
    <div className={styles.fieldGrid}>
      <FormField id="name" label="Your name" error={errors.name} required>
        {(field) => (
          <Input
            {...field}
            invalid={Boolean(errors.name)}
            value={values.name}
            onChange={(e) => onChange("name", e.target.value)}
            onBlur={() => onBlur("name")}
            placeholder="Jane Doe"
            autoComplete="name"
            disabled={disabled}
          />
        )}
      </FormField>

      <FormField id="email" label="Email" error={errors.email} required>
        {(field) => (
          <Input
            {...field}
            invalid={Boolean(errors.email)}
            type="email"
            value={values.email}
            onChange={(e) => onChange("email", e.target.value)}
            onBlur={() => onBlur("email")}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={disabled}
          />
        )}
      </FormField>

      <FormField id="password" label="Password" error={errors.password} required>
        {(field) => (
          <PasswordInput
            {...field}
            invalid={Boolean(errors.password)}
            value={values.password}
            onChange={(e) => onChange("password", e.target.value)}
            onBlur={() => onBlur("password")}
            placeholder="At least 8 characters"
            disabled={disabled}
          />
        )}
      </FormField>

      <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword} required>
        {(field) => (
          <PasswordInput
            {...field}
            invalid={Boolean(errors.confirmPassword)}
            value={values.confirmPassword}
            onChange={(e) => onChange("confirmPassword", e.target.value)}
            onBlur={() => onBlur("confirmPassword")}
            placeholder="Re-enter your password"
            disabled={disabled}
          />
        )}
      </FormField>
    </div>
  );
}
