export const ADMIN_CACHE_TTL_MS = 30_000;

export function getAdminUsersCacheKey(usuarioId: number) {
  return `admin:users:${usuarioId}`;
}

export function getAdminLogsCacheKey(usuarioId: number) {
  return `admin:logs:${usuarioId}`;
}

export function getAdminClosedReportsCacheKey(usuarioId: number) {
  return `admin:closed-reports:${usuarioId}`;
}