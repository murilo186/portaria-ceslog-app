import { z } from "zod";
import { apiRequestWithSchema } from "./api";
import { auditLogItemSchema, okResponseSchema, usuarioAdminListItemSchema } from "./contracts";
import type { AuditLogItem, UsuarioAdminListItem, UsuarioCreateInput } from "../types/usuario";

const usuariosSchema = z.array(usuarioAdminListItemSchema);
const auditLogsSchema = z.array(auditLogItemSchema);

export async function listUsuarios(token: string): Promise<UsuarioAdminListItem[]> {
  return apiRequestWithSchema("/api/admin/usuarios", usuariosSchema, { token });
}

export async function createUsuario(payload: UsuarioCreateInput, token: string): Promise<UsuarioAdminListItem> {
  return apiRequestWithSchema("/api/admin/usuarios", usuarioAdminListItemSchema, {
    method: "POST",
    body: payload,
    token,
  });
}

export async function deleteUsuario(usuarioId: number, token: string): Promise<void> {
  await apiRequestWithSchema(`/api/admin/usuarios/${usuarioId}`, okResponseSchema, {
    method: "DELETE",
    token,
  });
}

export async function updateUsuarioAtivo(usuarioId: number, ativo: boolean, token: string): Promise<void> {
  await apiRequestWithSchema(`/api/admin/usuarios/${usuarioId}/ativo`, okResponseSchema, {
    method: "PATCH",
    body: { ativo },
    token,
  });
}

export async function updateUsuarioSenha(usuarioId: number, novaSenha: string, token: string): Promise<void> {
  await apiRequestWithSchema(`/api/admin/usuarios/${usuarioId}/senha`, okResponseSchema, {
    method: "PATCH",
    body: { novaSenha },
    token,
  });
}

export async function listAuditLogs(token: string, limit = 20): Promise<AuditLogItem[]> {
  return apiRequestWithSchema(`/api/admin/logs?limit=${limit}`, auditLogsSchema, { token });
}
