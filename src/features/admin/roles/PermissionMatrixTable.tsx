import type { ModulePermissions } from "./permissionModules";
import styles from "./Roles.module.css";

export interface PermissionMatrixTableProps {
  modules: ModulePermissions[];
  selected: string[];
  onToggle: (key: string) => void;
  disabled?: boolean;
  emptyMessage?: string;
}

export function PermissionMatrixTable({ modules, selected, onToggle, disabled, emptyMessage }: PermissionMatrixTableProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.matrixTable}>
        <thead>
          <tr>
            <th>Module</th>
            <th>View</th>
            <th>Create</th>
            <th>Update</th>
            <th>Delete</th>
            <th>Other</th>
          </tr>
        </thead>
        <tbody>
          {modules.map((m) => (
            <tr key={m.module}>
              <td>{m.label}</td>
              {([m.view, m.create, m.update, m.delete] as (string | undefined)[]).map((key, idx) => (
                <td key={idx}>
                  {key ? (
                    <input
                      type="checkbox"
                      checked={selected.includes(key)}
                      onChange={() => onToggle(key)}
                      disabled={disabled}
                      aria-label={key}
                    />
                  ) : (
                    <span className={styles.dash}>—</span>
                  )}
                </td>
              ))}
              <td>
                {m.other.length === 0 ? (
                  <span className={styles.dash}>—</span>
                ) : (
                  <div className={styles.otherCell}>
                    {m.other.map((o) => (
                      <label key={o.key} className={styles.otherCheckbox}>
                        <input
                          type="checkbox"
                          checked={selected.includes(o.key)}
                          onChange={() => onToggle(o.key)}
                          disabled={disabled}
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          ))}
          {modules.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", color: "var(--color-text-faint)" }}>
                {emptyMessage ?? "No permissions match your search."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
