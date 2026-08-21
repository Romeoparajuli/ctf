import { useMemo, useState } from "react";
import { rolesApi } from "../../../api/roles";
import { errorMessage } from "../../../hooks/useAsyncData";
import { ApiError } from "../../../api/client";
import { Alert, Button, FormField, Input, Modal } from "../../../components/ui";
import { groupPermissionsByModule } from "./permissionModules";
import { PermissionMatrixTable } from "./PermissionMatrixTable";

export interface CreateRoleModalProps {
  allPermissions: string[];
  onClose: () => void;
  onCreated: () => void;
}

export function CreateRoleModal({ allPermissions, onClose, onCreated }: CreateRoleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const modules = useMemo(() => groupPermissionsByModule(allPermissions), [allPermissions]);

  const toggle = (key: string) => {
    setPermissions((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const handleCreate = async () => {
    setError(null);
    setFieldErrors({});
    const normalizedName = name.trim().toUpperCase().replace(/\s+/g, "_");
    if (!normalizedName) {
      setFieldErrors({ name: "Role name is required." });
      return;
    }
    setIsSaving(true);
    try {
      await rolesApi.create({ name: normalizedName, description: description || undefined, permissions });
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setFieldErrors(err.fieldErrors);
      setError(errorMessage(err, "Could not create role."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open
      title="Create Role"
      description="Custom roles start with no permissions — grant what this role needs below."
      onClose={onClose}
      busy={isSaving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleCreate} isLoading={isSaving} loadingText="Creating…">
            Create Role
          </Button>
        </>
      }
    >
      {error && <Alert variant="error">{error}</Alert>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
        <FormField id="newRoleName" label="Role name" required error={fieldErrors.name} helperText="Stored as UPPER_SNAKE_CASE.">
          {(field) => <Input {...field} value={name} onChange={(e) => setName(e.target.value)} required />}
        </FormField>
        <FormField id="newRoleDescription" label="Description" error={fieldErrors.description}>
          {(field) => <Input {...field} value={description} onChange={(e) => setDescription(e.target.value)} />}
        </FormField>
      </div>

      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-2)" }}>
        Permissions ({permissions.length} selected)
      </p>
      <PermissionMatrixTable modules={modules} selected={permissions} onToggle={toggle} />
    </Modal>
  );
}
