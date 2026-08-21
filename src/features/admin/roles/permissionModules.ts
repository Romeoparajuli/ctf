/**
 * Groups the flat "module.action" permission catalog into a module x action
 * matrix, derived entirely from whatever permission strings the backend
 * actually reports — nothing here is a hardcoded module/action list, so a
 * new permission key shows up automatically without a frontend change.
 */
export interface ModulePermissions {
  module: string;
  label: string;
  view?: string;
  create?: string;
  update?: string;
  delete?: string;
  other: { key: string; label: string }[];
}

export function formatModuleName(module: string): string {
  return module
    .split("_")
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function formatActionLabel(action: string): string {
  const words = action.split("_");
  return words.map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");
}

export function groupPermissionsByModule(allPermissions: string[]): ModulePermissions[] {
  const byModule = new Map<string, ModulePermissions>();

  for (const key of allPermissions) {
    const dot = key.indexOf(".");
    const module = dot === -1 ? key : key.slice(0, dot);
    const action = dot === -1 ? "" : key.slice(dot + 1);

    if (!byModule.has(module)) {
      byModule.set(module, { module, label: formatModuleName(module), other: [] });
    }
    const entry = byModule.get(module)!;

    if (action === "view") entry.view = key;
    else if (action === "create") entry.create = key;
    else if (action === "update") entry.update = key;
    else if (action === "delete") entry.delete = key;
    else entry.other.push({ key, label: formatActionLabel(action) });
  }

  return Array.from(byModule.values()).sort((a, b) => a.label.localeCompare(b.label));
}

/** Distinct module display names covered by a role's permission list, capped for compact display. */
export function moduleSummary(rolePermissions: string[], maxShown = 5): { shown: string[]; extra: number } {
  const modules = Array.from(
    new Set(
      rolePermissions.map((p) => {
        const dot = p.indexOf(".");
        return dot === -1 ? p : p.slice(0, dot);
      })
    )
  )
    .map(formatModuleName)
    .sort();
  return { shown: modules.slice(0, maxShown), extra: Math.max(0, modules.length - maxShown) };
}
