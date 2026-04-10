import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

const adminUsuarioListSelect = {
  id: true,
  nome: true,
  usuario: true,
  email: true,
  perfil: true,
  turno: true,
  ativo: true,
  criadoEm: true,
} as const;

const usuarioMinimalSelect = {
  id: true,
} as const;

const usuarioManageSelect = {
  id: true,
  perfil: true,
  ativo: true,
} as const;

export type AdminUsuarioListItem = Prisma.UsuarioGetPayload<{
  select: typeof adminUsuarioListSelect;
}>;

export type UsuarioMinimal = Prisma.UsuarioGetPayload<{
  select: typeof usuarioMinimalSelect;
}>;

export type UsuarioManageItem = Prisma.UsuarioGetPayload<{
  select: typeof usuarioManageSelect;
}>;

export interface IUsuarioRepository {
  listUsuarios(): Promise<AdminUsuarioListItem[]>;
  findByUsuario(usuario: string): Promise<UsuarioMinimal | null>;
  createOperador(data: Prisma.UsuarioUncheckedCreateInput): Promise<AdminUsuarioListItem>;
  findByIdForManagement(usuarioId: number): Promise<UsuarioManageItem | null>;
  deactivateById(usuarioId: number): Promise<void>;
  updateSenhaHash(usuarioId: number, senhaHash: string): Promise<void>;
}

export const usuarioRepository: IUsuarioRepository = {
  async listUsuarios() {
    return prisma.usuario.findMany({
      select: adminUsuarioListSelect,
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    });
  },

  async findByUsuario(usuario: string) {
    return prisma.usuario.findFirst({
      where: { usuario },
      select: usuarioMinimalSelect,
    });
  },

  async createOperador(data: Prisma.UsuarioUncheckedCreateInput) {
    return prisma.usuario.create({
      data,
      select: adminUsuarioListSelect,
    });
  },

  async findByIdForManagement(usuarioId: number) {
    return prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: usuarioManageSelect,
    });
  },

  async deactivateById(usuarioId: number) {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { ativo: false },
    });
  },

  async updateSenhaHash(usuarioId: number, senhaHash: string) {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { senhaHash },
    });
  },
};
