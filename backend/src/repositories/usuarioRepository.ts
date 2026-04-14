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
  listUsuarios(tenantId: number): Promise<AdminUsuarioListItem[]>;
  findByUsuario(usuario: string): Promise<UsuarioMinimal | null>;
  createOperador(data: Prisma.UsuarioUncheckedCreateInput): Promise<AdminUsuarioListItem>;
  findByIdForManagement(tenantId: number, usuarioId: number): Promise<UsuarioManageItem | null>;
  deactivateById(tenantId: number, usuarioId: number): Promise<void>;
  activateById(tenantId: number, usuarioId: number): Promise<void>;
  updateSenhaHash(tenantId: number, usuarioId: number, senhaHash: string): Promise<void>;
}

export const usuarioRepository: IUsuarioRepository = {
  async listUsuarios(tenantId: number) {
    return prisma.usuario.findMany({
      where: { tenantId },
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

  async findByIdForManagement(tenantId: number, usuarioId: number) {
    return prisma.usuario.findFirst({
      where: {
        tenantId,
        id: usuarioId,
      },
      select: usuarioManageSelect,
    });
  },

  async deactivateById(tenantId: number, usuarioId: number) {
    await prisma.usuario.updateMany({
      where: {
        tenantId,
        id: usuarioId,
      },
      data: { ativo: false },
    });
  },

  async activateById(tenantId: number, usuarioId: number) {
    await prisma.usuario.updateMany({
      where: {
        tenantId,
        id: usuarioId,
      },
      data: { ativo: true },
    });
  },

  async updateSenhaHash(tenantId: number, usuarioId: number, senhaHash: string) {
    await prisma.usuario.updateMany({
      where: {
        tenantId,
        id: usuarioId,
      },
      data: { senhaHash },
    });
  },
};
