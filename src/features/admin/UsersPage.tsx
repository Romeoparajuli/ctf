import { useState } from "react";
import { errorMessage, useAsyncData } from "../../hooks/useAsyncData";
import { usersApi } from "../../api/users";
import { rolesApi } from "../../api/roles";
import { Alert, Badge, Input, Select, Spinner, StatusBadge } from "../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import styles from "./Admin.module.css";

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

  const canManage = hasPermission("users.update");

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

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.subtitle}>Manage participant and staff accounts.</p>
        </div>
      </div>

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
        <Alert variant="success" title="Password reset">
          Temporary password: <code>{tempPassword}</code> — share this securely; it will not be shown again.
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
                        <StatusBadge status={u.status} />
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
                          {u.roles.length === 0 && <Badge>None</Badge>}
                          {u.roles.map((roleName) => {
                            const role = rolesData?.items.find((r) => r.name === roleName);
                            return (
                              <Badge key={roleName} tone="accent">
                                {roleName}
                                {canManage && role && (
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
