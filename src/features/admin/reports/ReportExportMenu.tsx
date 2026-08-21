import { useEffect, useRef, useState } from "react";
import { downloadReport, type ReportExportFormat, type ReportFilters, type ReportId } from "../../../api/reports";
import { errorMessage } from "../../../hooks/useAsyncData";
import { Button } from "../../../components/ui";
import styles from "./Reports.module.css";

const FORMAT_LABELS: Record<ReportExportFormat, string> = {
  pdf: "Download PDF",
  xlsx: "Download Excel",
  docx: "Download Word",
  csv: "Download CSV",
};

const FORMAT_ORDER: ReportExportFormat[] = ["pdf", "xlsx", "docx", "csv"];

export interface ReportExportMenuProps {
  reportId: ReportId;
  filters: ReportFilters;
  disabled?: boolean;
  onError: (message: string) => void;
}

/** Single "Export ▾" action shared by every report — no report-specific export logic lives here or in callers. */
export function ReportExportMenu({ reportId, filters, disabled, onError }: ReportExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<ReportExportFormat | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleExport = async (format: ReportExportFormat) => {
    setOpen(false);
    setPending(format);
    try {
      await downloadReport(reportId, format, filters);
    } catch (err) {
      onError(errorMessage(err, "Unable to generate the report. Please try again."));
    } finally {
      setPending(null);
    }
  };

  return (
    <div className={styles.exportMenu} ref={containerRef}>
      <Button variant="secondary" onClick={() => setOpen((v) => !v)} disabled={disabled || pending !== null} isLoading={pending !== null} loadingText={pending ? `Exporting ${pending.toUpperCase()}…` : undefined}>
        Export ▾
      </Button>
      {open && (
        <div className={styles.exportDropdown} role="menu">
          {FORMAT_ORDER.map((format) => (
            <button key={format} role="menuitem" onClick={() => handleExport(format)}>
              {FORMAT_LABELS[format]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
