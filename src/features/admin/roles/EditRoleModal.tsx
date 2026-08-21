import { useState } from "react";
import { rolesApi } from "../../../api/roles";
import { errorMessage } from "../../../hooks/useAsyncData";
import { Alert, Button, FormField, Input, Modal } from "../../../components/ui";
import type { Role } from "../../../types/domain";

export interface EditRoleModalProps {
  role: Role;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Editing is limited to description — a role's name is its stable
 * identifier (referenced by the seeded permission catalog and, for system
 * roles, by application code), so the API never accepted renaming it.
 */
export function EditRoleModal({ role, onClose, onSaved }: EditRoleModalProps) {
  const [description, setDescription] = useState(role.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await rolesApi.update(role.id, { description });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err, "Could not save role."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open
      title={`Edit Role — ${role.name}`}
      onClose={onClose}
      busy={isSaving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving} loadingText="Saving…">
            Save
          </Button>
        </>
      }
    >
      {error && <Alert variant="error">{error}</Alert>}
      <FormField id="editRoleName" label="Role name" helperText="Role names cannot be changed.">
        {(field) => <Input {...field} value={role.name} disabled />}
      </FormField>
      <FormField id="editRoleDescription" label="Description">
        {(field) => <Input {...field} value={description} onChange={(e) => setDescription(e.target.value)} />}
      </FormField>
    </Modal>
  );
}
