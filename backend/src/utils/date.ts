const REPORT_TIMEZONE = "America/Sao_Paulo";

export function getBusinessDateKey(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

export function reportDateFromKey(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}
