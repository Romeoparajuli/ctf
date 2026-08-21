import { useAsyncData } from "../../../hooks/useAsyncData";
import { rolesApi } from "../../../api/roles";
import { Alert, EmptyState, Modal, Spinner, StatusBadge } from "../../../components/ui";
import styles from "./Roles.module.css";

export interface RoleUsersModalProps {
  roleId: number;
  roleName: string;
  onClose: () => void;
}

export function RoleUsersModal({ roleId, roleName, onClose }: RoleUsersModalProps) {
  const { data, isLoading, error } = useAsyncData(() => rolesApi.users(roleId), [roleId]);

  return (
    <Modal open title={`Users with role: ${roleName}`} onClose={onClose}>
      {error && <Alert variant="error">{error}</Alert>}
      {isLoading ? (
        <Spinner label="Loading users" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No users have this role yet" />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
