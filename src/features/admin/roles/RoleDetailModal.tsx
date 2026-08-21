import { useMemo } from "react";
import { Badge, Modal } from "../../../components/ui";
import type { Role } from "../../../types/domain";
import { groupPermissionsByModule } from "./permissionModules";
import styles from "./Roles.module.css";

export interface RoleDetailModalProps {
  role: Role;
  allPermissions: string[];
  onClose: () => void;
}

export function RoleDetailModal({ role, allPermissions, onClose }: RoleDetailModalProps) {
  const modules = useMemo(() => groupPermissionsByModule(allPermissions), [allPermissions]);
  const granted = new Set(role.permissions);

  return (
    <Modal open title={role.name} description={role.description ?? undefined} onClose={onClose}>
      <div style={{ display: "flex", gap: "var(--space-6)", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", margin: "0 0 4px" }}>Type</p>
          <Badge tone={role.is_system === 1 ? "neutral" : "accent"}>{role.is_system === 1 ? "System" : "Custom"}</Badge>
        </div>
        <div>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", margin: "0 0 4px" }}>Users</p>
          <p style={{ margin: 0 }}>{role.userCount}</p>
        </div>
        <div>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", margin: "0 0 4px" }}>Permissions</p>
          <p style={{ margin: 0 }}>{role.permissions.length}</p>
        </div>
      </div>

      <h3 className={styles.detailModuleTitle} style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-4)" }}>
        Assigned Permissions
      </h3>
      {modules.map((m) => {
        const items = [
          m.view && { key: m.view, label: "View" },
          m.create && { key: m.create, label: "Create" },
          m.update && { key: m.update, label: "Update" },
          m.delete && { key: m.delete, label: "Delete" },
          ...m.other,
        ].filter((x): x is { key: string; label: string } => Boolean(x));

        if (items.length === 0) return null;

        return (
          <div key={m.module} className={styles.detailModule}>
            <p className={styles.detailModuleTitle}>{m.label}</p>
            <div className={styles.detailPermList}>
              {items.map((item) => {
                const isGranted = granted.has(item.key);
                return (
                  <div
                    key={item.key}
                    className={`${styles.detailPermItem} ${isGranted ? styles.detailPermItemChecked : ""}`}
                  >
                    <span aria-hidden="true">{isGranted ? "✓" : "○"}</span>
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </Modal>
  );
}
