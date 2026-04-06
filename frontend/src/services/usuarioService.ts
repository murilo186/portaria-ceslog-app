import { apiRequest } from "./api";
import type { UsuarioAdminListItem, UsuarioCreateInput } from "../types/usuario";

export async function listUsuarios(token: string): Promise<UsuarioAdminListItem[]> {
  return apiRequest<UsuarioAdminListItem[]>("/api/admin/usuarios", { token });
}

export async function createUsuario(payload: UsuarioCreateInput, token: string): Promise<UsuarioAdminListItem> {
  return apiRequest<UsuarioAdminListItem>("/api/admin/usuarios", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function deleteUsuario(usuarioId: number, token: string): Promise<void> {
  await apiRequest<{ ok: true }>(`/api/admin/usuarios/${usuarioId}`, {
    method: "DELETE",
    token,
  });
}
