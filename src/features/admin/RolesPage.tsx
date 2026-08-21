import { FormEvent, useState } from "react";
import { errorMessage, useAsyncData } from "../../hooks/useAsyncData";
import { rolesApi } from "../../api/roles";
import { Alert, Badge, Button, Card, FormField, Input } from "../../components/ui";
import styles from "./Admin.module.css";

export function RolesPage() {
  const { data, isLoading, error, refetch } = useAsyncData(() => rolesApi.list(), []);
  const { data: permData } = useAsyncData(() => rolesApi.permissions(), []);

  const [expanded, setExpanded] = useState<number | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const startEdit = (roleId: number, permissions: string[]) => {
    setExpanded(roleId);
    setDraftPermissions(permissions);
  };

  const togglePermission = (perm: string) => {
    setDraftPermissions((prev) => (prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]));
  };

  const handleSave = async (roleId: number) => {
    setActionError(null);
    setIsSaving(true);
    try {
      await rolesApi.update(roleId, { permissions: draftPermissions });
      setExpanded(null);
      refetch();
    } catch (err) {
      setActionError(errorMessage(err, "Could not update role."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSaving(true);
    try {
      await rolesApi.create({ name: newName.trim().toUpperCase().replace(/\s+/g, "_"), description: newDescription, permissions: [] });
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
      refetch();
    } catch (err) {
      setActionError(errorMessage(err, "Could not create role."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Roles &amp; Permissions</h1>
          <p className={styles.subtitle}>Define what each role can do. Authorization is enforced on the backend.</p>
        </div>
        <Button onClick={() => setShowCreate((v) => !v)} variant="secondary">
          {showCreate ? "Cancel" : "New Role"}
        </Button>
      </div>

      {(error || actionError) && <Alert variant="error">{error ?? actionError}</Alert>}

      {showCreate && (
        <Card className={styles.section}>
          <form onSubmit={handleCreate} className={styles.filters} style={{ alignItems: "flex-end" }}>
            <FormField id="roleName" label="Role name" required>
              {(field) => <Input {...field} value={newName} onChange={(e) => setNewName(e.target.value)} required />}
            </FormField>
            <FormField id="roleDescription" label="Description">
              {(field) => <Input {...field} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />}
            </FormField>
            <Button type="submit" isLoading={isSaving}>
              Create Role
            </Button>
          </form>
        </Card>
      )}

      {isLoading ? null : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {data?.items.map((role) => (
            <Card key={role.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 className={styles.sectionTitle} style={{ marginBottom: 4 }}>
                    {role.name} {role.is_system === 1 && <Badge>System</Badge>}
                  </h2>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", margin: 0 }}>
                    {role.description} · {role.userCount} user(s)
                  </p>
                </div>
                {role.is_system !== 1 &&
                  (expanded === role.id ? (
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <Button variant="secondary" onClick={() => setExpanded(null)}>
                        Cancel
                      </Button>
                      <Button onClick={() => handleSave(role.id)} isLoading={isSaving}>
                        Save
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" onClick={() => startEdit(role.id, role.permissions)}>
                      Edit Permissions
                    </Button>
                  ))}
              </div>

              {expanded === role.id ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "var(--space-2)",
                    marginTop: "var(--space-4)",
                  }}
                >
                  {permData?.permissions.map((perm) => (
                    <label key={perm} style={{ display: "flex", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                      <input
                        type="checkbox"
                        checked={draftPermissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                      />
                      {perm}
                    </label>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)", marginTop: "var(--space-3)" }}>
                  {role.permissions.length === 0 ? (
                    <Badge>No permissions</Badge>
                  ) : (
                    role.permissions.slice(0, 12).map((p) => <Badge key={p}>{p}</Badge>)
                  )}
                  {role.permissions.length > 12 && <Badge>+{role.permissions.length - 12} more</Badge>}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
