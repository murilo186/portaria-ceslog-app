import { apiRequest } from "./api";
import type { AuditLogItem, UsuarioAdminListItem, UsuarioCreateInput } from "../types/usuario";

export async function listUsuarios(token: string): Promise<UsuarioAdminListItem[]> {
  return apiRequest<UsuarioAdminListItem[]>('/api/admin/usuarios', { token });
}

export async function createUsuario(payload: UsuarioCreateInput, token: string): Promise<UsuarioAdminListItem> {
  return apiRequest<UsuarioAdminListItem>('/api/admin/usuarios', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function deleteUsuario(usuarioId: number, token: string): Promise<void> {
  await apiRequest<{ ok: true }>(`/api/admin/usuarios/${usuarioId}`, {
    method: 'DELETE',
    token,
  });
}

export async function updateUsuarioSenha(usuarioId: number, novaSenha: string, token: string): Promise<void> {
  await apiRequest<{ ok: true }>(`/api/admin/usuarios/${usuarioId}/senha`, {
    method: 'PATCH',
    body: { novaSenha },
    token,
  });
}

export async function listAuditLogs(token: string, limit = 20): Promise<AuditLogItem[]> {
  return apiRequest<AuditLogItem[]>(`/api/admin/logs?limit=${limit}`, { token });
}
