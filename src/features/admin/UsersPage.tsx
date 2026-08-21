import { FormEvent, useState } from "react";
import { errorMessage, useAsyncData } from "../../hooks/useAsyncData";
import { usersApi } from "../../api/users";
import { rolesApi } from "../../api/roles";
import { ApiError } from "../../api/client";
import { Alert, Badge, Button, Card, FormField, Input, Select, Spinner, StatusBadge } from "../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import styles from "./Admin.module.css";

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"];

export function UsersPage() {
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [actionError, setActionError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useAsyncData(
    () => usersApi.list({ search: search || undefined, page, pageSize }),
    [search, page]
  );
  const { data: rolesData } = useAsyncData(() => rolesApi.list(), []);

  const canView = hasPermission("users.view");
  const canManage = hasPermission("users.update");
  const canCreate = hasPermission("users.create");
  // Role assignment requires roles.update too (server-enforced) — an
  // Administrator holding only users.update can no longer grant SUPER_ADMIN
  // through this screen. Hide the controls to match what the API will allow.
  const canAssignRoles = canManage && hasPermission("roles.update");

  const [showCreate, setShowCreate] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newStatus, setNewStatus] = useState("ACTIVE");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);

  const resetCreateForm = () => {
    setNewFullName("");
    setNewEmail("");
    setNewPhone("");
    setNewStatus("ACTIVE");
    setCreateError(null);
    setCreateFieldErrors({});
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateFieldErrors({});
    setIsCreating(true);
    try {
      const { temporaryPassword } = await usersApi.create({
        fullName: newFullName,
        email: newEmail,
        phone: newPhone || undefined,
        status: newStatus,
      });
      setTempPassword(temporaryPassword);
      setShowCreate(false);
      resetCreateForm();
      refetch();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setCreateFieldErrors(err.fieldErrors);
      setCreateError(errorMessage(err, "Could not create user."));
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: string) => {
    setActionError(null);
    try {
      if (currentStatus === "ACTIVE") await usersApi.deactivate(id);
      else await usersApi.reactivate(id);
      refetch();
    } catch (err) {
      setActionError(errorMessage(err, "Could not update user."));
    }
  };

  const handleAssignRole = async (userId: number, roleId: number) => {
    if (!roleId) return;
    setActionError(null);
    try {
      await usersApi.assignRole(userId, roleId);
      refetch();
    } catch (err) {
      setActionError(errorMessage(err, "Could not assign role."));
    }
  };

  const handleRemoveRole = async (userId: number, roleId: number) => {
    setActionError(null);
    try {
      await usersApi.removeRole(userId, roleId);
      refetch();
    } catch (err) {
      setActionError(errorMessage(err, "Could not remove role."));
    }
  };

  const handleResetPassword = async (id: number) => {
    setActionError(null);
    try {
      const { temporaryPassword } = await usersApi.resetPassword(id);
      setTempPassword(temporaryPassword);
    } catch (err) {
      setActionError(errorMessage(err, "Could not reset password."));
    }
  };

  if (!canView) {
    return <Alert variant="error">You do not have permission to view users.</Alert>;
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.subtitle}>Manage participant and staff accounts.</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setShowCreate((v) => !v);
              if (showCreate) resetCreateForm();
            }}
            variant="secondary"
          >
            {showCreate ? "Cancel" : "Create User"}
          </Button>
        )}
      </div>

      {showCreate && (
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Create User</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
            A random one-time password is generated for this account — it must be changed before the account can be
            used for anything else. No initial role is assigned; add one from the table below once the account exists.
          </p>
          {createError && <Alert variant="error">{createError}</Alert>}
          <form onSubmit={handleCreate} noValidate>
            <div className={styles.filters}>
              <FormField id="newFullName" label="Full name" required error={createFieldErrors.fullName}>
                {(field) => (
                  <Input {...field} value={newFullName} onChange={(e) => setNewFullName(e.target.value)} required />
                )}
              </FormField>
              <FormField id="newEmail" label="Email" required error={createFieldErrors.email}>
                {(field) => (
                  <Input
                    {...field}
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                )}
              </FormField>
              <FormField id="newPhone" label="Phone" helperText="Optional" error={createFieldErrors.phone}>
                {(field) => <Input {...field} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />}
              </FormField>
              <FormField id="newStatus" label="Initial status">
                {(field) => (
                  <Select {...field} value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>
            </div>
            <Button type="submit" isLoading={isCreating} loadingText="Creating…">
              Create user
            </Button>
          </form>
        </Card>
      )}

      <div className={styles.filters}>
        <Input
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 280 }}
        />
      </div>

      {(error || actionError) && <Alert variant="error">{error ?? actionError}</Alert>}
      {tempPassword && (
        <Alert variant="success" title="Temporary password issued">
          <code>{tempPassword}</code> — share this with the user securely (not email/chat in plaintext where
          avoidable). It will not be shown again, and the account cannot be used for anything until they change it.
        </Alert>
      )}

      {isLoading ? (
        <Spinner label="Loading users" />
      ) : (
        data && (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Roles</th>
                    {canManage && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u) => (
                    <tr key={u.id}>
                      <td>{u.full_name}</td>
                      <td>{u.email}</td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
                          <StatusBadge status={u.status} />
                          {u.must_change_password === 1 && <Badge tone="warning">Password change pending</Badge>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
                          {u.roles.length === 0 && <Badge>None</Badge>}
                          {u.roles.map((roleName) => {
                            const role = rolesData?.items.find((r) => r.name === roleName);
                            return (
                              <Badge key={roleName} tone="accent">
                                {roleName}
                                {canAssignRoles && role && (
                                  <button
                                    onClick={() => handleRemoveRole(u.id, role.id)}
                                    aria-label={`Remove ${roleName} role`}
                                    style={{ marginLeft: 6, background: "none", border: "none", color: "inherit", cursor: "pointer" }}
                                  >
                                    ×
                                  </button>
                                )}
                              </Badge>
                            );
                          })}
                        </div>
                      </td>
                      {canManage && (
                        <td className={styles.rowActions}>
                          {canAssignRoles && (
                            <Select
                              defaultValue=""
                              onChange={(e) => {
                                handleAssignRole(u.id, Number(e.target.value));
                                e.target.value = "";
                              }}
                              aria-label={`Assign role to ${u.full_name}`}
                            >
                              <option value="">+ Assign role</option>
                              {rolesData?.items
                                .filter((r) => !u.roles.includes(r.name))
                                .map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                            </Select>
                          )}
                          <button onClick={() => handleToggleActive(u.id, u.status)}>
                            {u.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                          </button>
                          <button onClick={() => handleResetPassword(u.id)}>Reset password</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.pagination}>
              <span>
                Page {data.page} of {Math.max(1, Math.ceil(data.total / data.pageSize))} ({data.total} total)
              </span>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <button disabled={page * pageSize >= data.total} onClick={() => setPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
