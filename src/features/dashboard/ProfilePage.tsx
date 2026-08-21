import { FormEvent, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { usersApi } from "../../api/users";
import { errorMessage } from "../../hooks/useAsyncData";
import { ApiError } from "../../api/client";
import { Alert, Button, Card, FormField, Input, PasswordInput } from "../../components/ui";
import styles from "./DashboardPage.module.css";

export function ProfilePage() {
  const { user, refresh } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Record<string, string>>({});

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    setIsSavingProfile(true);
    try {
      await usersApi.updateMyProfile({ fullName });
      await refresh();
      setProfileMessage("Profile updated.");
    } catch (err) {
      setProfileError(errorMessage(err, "Could not update profile."));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);
    setPasswordFieldErrors({});
    setIsSavingPassword(true);
    try {
      await usersApi.changeMyPassword({ currentPassword, newPassword });
      setPasswordMessage("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setPasswordFieldErrors(err.fieldErrors);
      setPasswordError(errorMessage(err, "Could not change password."));
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className={`container ${styles.wrap}`}>
      <h1 className={styles.title}>My Profile</h1>

      <div className={styles.grid}>
        <Card>
          <h2 className={styles.sectionTitle}>Profile Details</h2>
          {profileMessage && <Alert variant="success">{profileMessage}</Alert>}
          {profileError && <Alert variant="error">{profileError}</Alert>}
          <form onSubmit={handleProfileSubmit} noValidate>
            <FormField id="fullName" label="Full name" required>
              {(field) => <Input {...field} value={fullName} onChange={(e) => setFullName(e.target.value)} required />}
            </FormField>
            <FormField id="email" label="Email">
              {(field) => <Input {...field} value={user?.email ?? ""} disabled />}
            </FormField>
            <div style={{ marginTop: "var(--space-4)" }}>
              <Button type="submit" isLoading={isSavingProfile} loadingText="Saving…">
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Change Password</h2>
          {passwordMessage && <Alert variant="success">{passwordMessage}</Alert>}
          {passwordError && <Alert variant="error">{passwordError}</Alert>}
          <form onSubmit={handlePasswordSubmit} noValidate>
            <FormField id="currentPassword" label="Current password" required error={passwordFieldErrors.currentPassword}>
              {(field) => (
                <PasswordInput {...field} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              )}
            </FormField>
            <FormField id="newPassword" label="New password" required error={passwordFieldErrors.newPassword}>
              {(field) => (
                <PasswordInput {...field} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              )}
            </FormField>
            <div style={{ marginTop: "var(--space-4)" }}>
              <Button type="submit" isLoading={isSavingPassword} loadingText="Updating…">
                Change password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
