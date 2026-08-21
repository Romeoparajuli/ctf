import { useEffect, useMemo, useRef, useState } from "react";
import { errorMessage, useAsyncData } from "../../../hooks/useAsyncData";
import { termsApi, type TermsRecord, type TermsStatus } from "../../../api/terms";
import { eventsApi } from "../../../api/events";
import { useAuth } from "../../../auth/AuthContext";
import { Alert, Button, ConfirmDialog, EmptyState, Input, Select, Spinner, StatusBadge } from "../../../components/ui";
import { TermsAndConditionsModal } from "../../../components/registration/TermsAndConditionsModal";
import { formatDate } from "../../../utils/format";
import { TermsFormModal } from "./TermsFormModal";
import { TermsAcceptancesModal } from "./TermsAcceptancesModal";
import styles from "./Terms.module.css";

type StatusFilter = "" | TermsStatus;

export function TermsPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("terms.create");
  const canUpdate = hasPermission("terms.update");
  const canPublish = hasPermission("terms.publish");
  const canArchive = hasPermission("terms.archive");
  const canDelete = hasPermission("terms.delete");
  const canPreview = hasPermission("terms.preview");
  const canViewAcceptances = hasPermission("terms.acceptance_view");

  const [eventFilter, setEventFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch } = useAsyncData(
    () => termsApi.list({ eventId: eventFilter || undefined, status: statusFilter || undefined, search: search || undefined }),
    [eventFilter, statusFilter, search]
  );
  const { data: eventsData } = useAsyncData(() => eventsApi.list(), []);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const menuRefs = useRef(new Map<number, HTMLTableCellElement>());

  useEffect(() => {
    if (openMenuId === null) return;
    const handleClickOutside = (e: MouseEvent) => {
      const container = menuRefs.current.get(openMenuId);
      if (container && !container.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const [showCreate, setShowCreate] = useState(false);
  const [editTerms, setEditTerms] = useState<TermsRecord | null>(null);
  const [acceptancesTerms, setAcceptancesTerms] = useState<TermsRecord | null>(null);
  const [publishTarget, setPublishTarget] = useState<TermsRecord | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<TermsRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TermsRecord | null>(null);
  const [isActing, setIsActing] = useState(false);

  const [previewData, setPreviewData] = useState<{ title: string; version: string; renderedHtml: string } | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);

  const handlePreview = async (terms: TermsRecord) => {
    setOpenMenuId(null);
    setActionError(null);
    setPreviewLoadingId(terms.id);
    try {
      const res = await termsApi.preview(terms.id);
      setPreviewData({ title: res.terms.title, version: res.terms.version, renderedHtml: res.terms.rendered_html });
    } catch (err) {
      setActionError(errorMessage(err, "Could not load preview."));
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const handlePublish = async () => {
    if (!publishTarget) return;
    setActionError(null);
    setIsActing(true);
    try {
      await termsApi.publish(publishTarget.id);
      setPublishTarget(null);
      refetch();
    } catch (err) {
      setActionError(errorMessage(err, "Could not publish these terms."));
    } finally {
      setIsActing(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    setActionError(null);
    setIsActing(true);
    try {
      await termsApi.archive(archiveTarget.id);
      setArchiveTarget(null);
      refetch();
    } catch (err) {
      setActionError(errorMessage(err, "Could not archive these terms."));
    } finally {
      setIsActing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionError(null);
    setIsActing(true);
    try {
      await termsApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setActionError(errorMessage(err, "Could not delete these terms."));
    } finally {
      setIsActing(false);
    }
  };

  const events = useMemo(() => eventsData?.items ?? [], [eventsData]);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Terms & Conditions</h1>
          <p className={styles.subtitle}>Create and manage the terms participants must accept before registering for an event.</p>
        </div>
        {canCreate && <Button onClick={() => setShowCreate(true)}>+ Create Terms</Button>}
      </div>

      <div className={styles.filters}>
        <Input placeholder="Search terms…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 240 }} />
        <Select value={eventFilter} onChange={(e) => setEventFilter(e.target.value ? Number(e.target.value) : "")}>
          <option value="">Event: All</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
          <option value="">Status: All</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </div>

      {(error || actionError) && <Alert variant="error">{error ?? actionError}</Alert>}

      {isLoading ? (
        <Spinner label="Loading terms" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No Terms & Conditions found" description={canCreate ? "Create the first version for an event." : undefined} />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Event</th>
                <th>Version</th>
                <th>Status</th>
                <th>Effective Date</th>
                <th>Created By</th>
                <th>Updated At</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((terms) => (
                <tr key={terms.id}>
                  <td>
                    <div className={styles.titleCell}>
                      <span className={styles.titleButton} onClick={() => handlePreview(terms)}>
                        {terms.title || "(untitled)"}
                      </span>
                      <span className={styles.metaLine}>{terms.acceptance_count} acceptance{terms.acceptance_count === 1 ? "" : "s"}</span>
                    </div>
                  </td>
                  <td>{terms.event_name ?? "—"}</td>
                  <td>v{terms.version}</td>
                  <td>
                    <StatusBadge status={terms.status} />
                  </td>
                  <td>{terms.effective_date ? formatDate(terms.effective_date) : "—"}</td>
                  <td>{terms.created_by_name ?? "—"}</td>
                  <td>{formatDate(terms.updated_at)}</td>
                  <td
                    className={styles.actionsCell}
                    ref={(el) => {
                      if (el) menuRefs.current.set(terms.id, el);
                      else menuRefs.current.delete(terms.id);
                    }}
                  >
                    <button
                      className={styles.menuButton}
                      onClick={() => setOpenMenuId(openMenuId === terms.id ? null : terms.id)}
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === terms.id}
                      aria-label={`Actions for ${terms.title}`}
                      disabled={previewLoadingId === terms.id}
                    >
                      {previewLoadingId === terms.id ? "…" : "⋮"}
                    </button>
                    {openMenuId === terms.id && (
                      <div className={styles.menu} role="menu">
                        {canPreview && (
                          <button role="menuitem" onClick={() => handlePreview(terms)}>
                            Preview
                          </button>
                        )}
                        {canUpdate && terms.status === "DRAFT" && (
                          <button
                            role="menuitem"
                            onClick={() => {
                              setEditTerms(terms);
                              setOpenMenuId(null);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {canPublish && terms.status === "DRAFT" && (
                          <button
                            role="menuitem"
                            onClick={() => {
                              setPublishTarget(terms);
                              setOpenMenuId(null);
                            }}
                          >
                            Publish
                          </button>
                        )}
                        {canArchive && terms.status !== "ARCHIVED" && (
                          <button
                            role="menuitem"
                            onClick={() => {
                              setArchiveTarget(terms);
                              setOpenMenuId(null);
                            }}
                          >
                            Archive
                          </button>
                        )}
                        {canViewAcceptances && (
                          <button
                            role="menuitem"
                            onClick={() => {
                              setAcceptancesTerms(terms);
                              setOpenMenuId(null);
                            }}
                          >
                            View Acceptances
                          </button>
                        )}
                        {canDelete && terms.status === "DRAFT" && (
                          <>
                            <div className={styles.menuDivider} />
                            <button
                              role="menuitem"
                              className={styles.danger}
                              onClick={() => {
                                setDeleteTarget(terms);
                                setOpenMenuId(null);
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <TermsFormModal
          events={events}
          canPublish={canPublish}
          onClose={() => setShowCreate(false)}
          onSaved={refetch}
        />
      )}

      {editTerms && (
        <TermsFormModal existing={editTerms} events={events} canPublish={canPublish} onClose={() => setEditTerms(null)} onSaved={refetch} />
      )}

      {acceptancesTerms && <TermsAcceptancesModal terms={acceptancesTerms} onClose={() => setAcceptancesTerms(null)} />}

      {previewData && (
        <TermsAndConditionsModal open previewTerms={previewData} onCancel={() => setPreviewData(null)} />
      )}

      <ConfirmDialog
        open={publishTarget !== null}
        title="Publish Terms & Conditions?"
        description={
          publishTarget
            ? `You are about to publish "${publishTarget.title}" version ${publishTarget.version}. It will become the active terms participants must accept. Any currently published version for this event will be archived.`
            : ""
        }
        confirmLabel="Publish"
        isLoading={isActing}
        onConfirm={handlePublish}
        onCancel={() => setPublishTarget(null)}
      />

      <ConfirmDialog
        open={archiveTarget !== null}
        title="Archive Terms & Conditions?"
        description={
          archiveTarget
            ? `"${archiveTarget.title}" version ${archiveTarget.version} will no longer be published or editable.${
                archiveTarget.status === "PUBLISHED" ? " Participants will not be able to register until a new version is published." : ""
              }`
            : ""
        }
        confirmLabel="Archive"
        confirmVariant="danger"
        isLoading={isActing}
        onConfirm={handleArchive}
        onCancel={() => setArchiveTarget(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Draft?"
        description={deleteTarget ? `Delete the draft "${deleteTarget.title}" version ${deleteTarget.version}? This cannot be undone.` : ""}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={isActing}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
