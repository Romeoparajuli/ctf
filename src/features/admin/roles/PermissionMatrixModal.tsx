import { useMemo, useState } from "react";
import { rolesApi } from "../../../api/roles";
import { errorMessage } from "../../../hooks/useAsyncData";
import { Alert, Button, Input, Modal } from "../../../components/ui";
import type { Role } from "../../../types/domain";
import { groupPermissionsByModule } from "./permissionModules";
import { PermissionMatrixTable } from "./PermissionMatrixTable";

export interface PermissionMatrixModalProps {
  role: Role;
  allPermissions: string[];
  onClose: () => void;
  onSaved: () => void;
}

export function PermissionMatrixModal({ role, allPermissions, onClose, onSaved }: PermissionMatrixModalProps) {
  const [draft, setDraft] = useState<string[]>(role.permissions);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = role.name === "SUPER_ADMIN";

  const modules = useMemo(() => groupPermissionsByModule(allPermissions), [allPermissions]);
  const filteredModules = useMemo(() => {
    if (!search.trim()) return modules;
    const q = search.trim().toLowerCase();
    return modules.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.module.toLowerCase().includes(q) ||
        m.other.some((o) => o.label.toLowerCase().includes(q))
    );
  }, [modules, search]);

  const toggle = (key: string) => {
    if (locked) return;
    setDraft((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const handleSave = async () => {
    if (locked) return;
    setError(null);
    setIsSaving(true);
    try {
      await rolesApi.update(role.id, { permissions: draft });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err, "Could not save permissions."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open
      title={`Manage Permissions — ${role.name}`}
      description={
        locked
          ? "The SUPER_ADMIN role's permissions cannot be modified."
          : "Toggle what this role can access, grouped by module."
      }
      onClose={onClose}
      busy={isSaving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          {!locked && (
            <Button onClick={handleSave} isLoading={isSaving} loadingText="Saving…">
              Save Permissions
            </Button>
          )}
        </>
      }
    >
      {error && <Alert variant="error">{error}</Alert>}

      <div style={{ marginBottom: "var(--space-4)" }}>
        <Input
          placeholder="Search permissions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search permissions"
        />
      </div>

      <PermissionMatrixTable
        modules={filteredModules}
        selected={draft}
        onToggle={toggle}
        disabled={locked}
        emptyMessage={`No permissions match "${search}".`}
      />
    </Modal>
  );
}
