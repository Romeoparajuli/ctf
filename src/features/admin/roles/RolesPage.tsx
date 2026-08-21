import { useEffect, useMemo, useRef, useState } from "react";
import { errorMessage, useAsyncData } from "../../../hooks/useAsyncData";
import { rolesApi } from "../../../api/roles";
import { useAuth } from "../../../auth/AuthContext";
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Input,
  Select,
  Spinner,
} from "../../../components/ui";
import type { Role } from "../../../types/domain";
import { moduleSummary } from "./permissionModules";
import { CreateRoleModal } from "./CreateRoleModal";
import { PermissionMatrixModal } from "./PermissionMatrixModal";
import { RoleDetailModal } from "./RoleDetailModal";
import { RoleUsersModal } from "./RoleUsersModal";
import styles from "./Roles.module.css";

type TypeFilter = "all" | "system" | "custom";

export function RolesPage() {
  const { hasPermission } = useAuth();
  const { data, isLoading, error, refetch } = useAsyncData(() => rolesApi.list(), []);
  const { data: permData } = useAsyncData(() => rolesApi.permissions(), []);
  const allPermissions = permData?.permissions ?? [];

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const menuRefs = useRef(new Map<number, HTMLTableCellElement>());

  useEffect(() => {
    if (openMenuId === null) return;
    const handleClickOutside = (e: MouseEvent) => {
      const container = menuRefs.current.get(openMenuId);
      if (container && !container.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const [showCreate, setShowCreate] = useState(false);
  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const [matrixRole, setMatrixRole] = useState<Role | null>(null);
  const [usersRole, setUsersRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = hasPermission("roles.create");
  const canManagePermissions = hasPermission("roles.update");
  const canDelete = hasPermission("roles.delete");

  const filteredRoles = useMemo(() => {
    if (!data) return [];
    return data.items.filter((role) => {
      if (typeFilter === "system" && role.is_system !== 1) return false;
      if (typeFilter === "custom" && role.is_system === 1) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!role.name.toLowerCase().includes(q) && !(role.description ?? "").toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [data, search, typeFilter]);

  const handleDelete = async () => {
    if (!deleteRole) return;
    setActionError(null);
    setIsDeleting(true);
    try {
      await rolesApi.remove(deleteRole.id);
      setDeleteRole(null);
      refetch();
    } catch (err) {
      setActionError(errorMessage(err, "Could not delete role."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Roles &amp; Permissions</h1>
          <p className={styles.subtitle}>Define what each role can do. Authorization is enforced on the backend.</p>
        </div>
        {canCreate && <Button onClick={() => setShowCreate(true)}>+ New Role</Button>}
      </div>

      <div className={styles.filters}>
        <Input
          placeholder="Search roles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
          aria-label="Search roles"
        />
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          aria-label="Filter by type"
        >
          <option value="all">Type: All</option>
          <option value="system">Type: System</option>
          <option value="custom">Type: Custom</option>
        </Select>
      </div>

      {(error || actionError) && <Alert variant="error">{error ?? actionError}</Alert>}

      {isLoading ? (
        <Spinner label="Loading roles" />
      ) : filteredRoles.length === 0 ? (
        <EmptyState
          title={data && data.items.length === 0 ? "No roles found" : "No roles match your filters"}
          description={data && data.items.length === 0 ? "Create your first custom role." : undefined}
        />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Role</th>
                <th>Description</th>
                <th>Type</th>
                <th>Status</th>
                <th>Users</th>
                <th>Permissions</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map((role) => {
                const { shown, extra } = moduleSummary(role.permissions);
                return (
                  <tr key={role.id}>
                    <td>
                      <div className={styles.roleNameCell}>
                        <button className={styles.roleNameButton} onClick={() => setDetailRole(role)}>
                          {role.name}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={styles.description}>{role.description ?? "—"}</span>
                    </td>
                    <td>
                      <Badge tone={role.is_system === 1 ? "neutral" : "accent"}>
                        {role.is_system === 1 ? "System" : "Custom"}
                      </Badge>
                    </td>
                    <td>
                      <Badge tone="success">Active</Badge>
                    </td>
                    <td>{role.userCount}</td>
                    <td>
                      {role.permissions.length === 0 ? (
                        <Badge>No permissions</Badge>
                      ) : (
                        <div className={styles.moduleChips}>
                          {shown.map((label) => (
                            <Badge key={label}>{label}</Badge>
                          ))}
                          {extra > 0 && <Badge tone="accent">+{extra} more</Badge>}
                          <span className={styles.permCount}>({role.permissions.length})</span>
                        </div>
                      )}
                    </td>
                    <td
                      className={styles.actionsCell}
                      ref={(el) => {
                        if (el) menuRefs.current.set(role.id, el);
                        else menuRefs.current.delete(role.id);
                      }}
                    >
                      <button
                        className={styles.menuButton}
                        onClick={() => setOpenMenuId(openMenuId === role.id ? null : role.id)}
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === role.id}
                        aria-label={`Actions for ${role.name}`}
                      >
                        ⋮
                      </button>
                      {openMenuId === role.id && (
                        <div className={styles.menu} role="menu">
                          <button
                            role="menuitem"
                            onClick={() => {
                              setDetailRole(role);
                              setOpenMenuId(null);
                            }}
                          >
                            View Role
                          </button>
                          {canManagePermissions && (
                            <button
                              role="menuitem"
                              onClick={() => {
                                setMatrixRole(role);
                                setOpenMenuId(null);
                              }}
                            >
                              Manage Permissions
                            </button>
                          )}
                          <button
                            role="menuitem"
                            onClick={() => {
                              setUsersRole(role);
                              setOpenMenuId(null);
                            }}
                          >
                            View Users
                          </button>
                          {canDelete && role.is_system !== 1 && (
                            <>
                              <div className={styles.menuDivider} />
                              <button
                                role="menuitem"
                                className={styles.danger}
                                onClick={() => {
                                  setDeleteRole(role);
                                  setOpenMenuId(null);
                                }}
                              >
                                Delete Role
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateRoleModal allPermissions={allPermissions} onClose={() => setShowCreate(false)} onCreated={refetch} />
      )}

      {detailRole && (
        <RoleDetailModal role={detailRole} allPermissions={allPermissions} onClose={() => setDetailRole(null)} />
      )}

      {matrixRole && (
        <PermissionMatrixModal
          role={matrixRole}
          allPermissions={allPermissions}
          onClose={() => setMatrixRole(null)}
          onSaved={refetch}
        />
      )}

      {usersRole && (
        <RoleUsersModal roleId={usersRole.id} roleName={usersRole.name} onClose={() => setUsersRole(null)} />
      )}

      <ConfirmDialog
        open={deleteRole !== null}
        title="Delete Role?"
        description={
          deleteRole
            ? `Are you sure you want to delete "${deleteRole.name}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete Role"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteRole(null)}
      />
    </div>
  );
}
