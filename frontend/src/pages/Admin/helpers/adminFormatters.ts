export function formatDate(dateIso: string): string {
  const iso = dateIso.slice(0, 10);
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function formatDateTime(dateIso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(dateIso));
}

export function formatActionLabel(action: string): string {
  return action.replaceAll("_", " ");
}

export function formatAuditDetails(details: Record<string, unknown> | null): string | null {
  if (!details) {
    return null;
  }

  const entries = Object.entries(details);

  if (entries.length === 0) {
    return null;
  }

  return entries.map(([key, value]) => `${key}: ${String(value ?? "-")}`).join(" | ");
}

export function formatUserAgent(userAgent: string | null): string {
  if (!userAgent) {
    return "-";
  }

  if (userAgent.length <= 80) {
    return userAgent;
  }

  return `${userAgent.slice(0, 77)}...`;
}