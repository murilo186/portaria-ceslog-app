import { env } from "../config/env";
import { getMssqlPool } from "../lib/mssql";
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

type UsuarioListRow = {
  id: number;
  nome: string;
  usuario: string | null;
  email: string | null;
  perfil: string;
  turno: string | null;
  ativo: boolean;
  criadoEm: Date;
};

export interface IUsuarioRepository {
  listUsuarios(tenantId: number): Promise<AdminUsuarioListItem[]>;
  findByUsuario(usuario: string): Promise<UsuarioMinimal | null>;
  createOperador(data: Prisma.UsuarioUncheckedCreateInput): Promise<AdminUsuarioListItem>;
  findByIdForManagement(tenantId: number, usuarioId: number): Promise<UsuarioManageItem | null>;
  deactivateById(tenantId: number, usuarioId: number): Promise<void>;
  activateById(tenantId: number, usuarioId: number): Promise<void>;
  updateSenhaHash(tenantId: number, usuarioId: number, senhaHash: string): Promise<void>;
}

async function listUsuariosMssql(tenantId: number): Promise<AdminUsuarioListItem[]> {
  const pool = await getMssqlPool();
  const result = await pool.request().input("tenantId", tenantId).query<UsuarioListRow>(`
      SELECT
        id, nome, usuario, email, perfil, turno, ativo, criadoEm
      FROM portaria.portaria_usuarios
      WHERE tenantId = @tenantId
      ORDER BY ativo DESC, nome ASC
    `);

  return result.recordset as unknown as AdminUsuarioListItem[];
}

async function findByUsuarioMssql(usuario: string): Promise<UsuarioMinimal | null> {
  const pool = await getMssqlPool();
  const result = await pool.request().input("usuario", usuario).query<{ id: number }>(`
      SELECT TOP 1 id
      FROM portaria.portaria_usuarios
      WHERE usuario = @usuario
    `);

  return (result.recordset[0] as unknown as UsuarioMinimal | undefined) ?? null;
}

async function createOperadorMssql(data: Prisma.UsuarioUncheckedCreateInput): Promise<AdminUsuarioListItem> {
  const pool = await getMssqlPool();
  const result = await pool
    .request()
    .input("tenantId", Number(data.tenantId))
    .input("nome", String(data.nome))
    .input("usuario", String(data.usuario))
    .input("email", data.email ? String(data.email) : null)
    .input("senhaHash", String(data.senhaHash))
    .input("perfil", String(data.perfil))
    .input("turno", data.turno ? String(data.turno) : null)
    .input("ativo", Boolean(data.ativo))
    .query<UsuarioListRow>(`
      INSERT INTO portaria.portaria_usuarios
      (tenantId, nome, usuario, email, senhaHash, perfil, turno, ativo, criadoEm)
      OUTPUT INSERTED.id, INSERTED.nome, INSERTED.usuario, INSERTED.email, INSERTED.perfil, INSERTED.turno, INSERTED.ativo, INSERTED.criadoEm
      VALUES
      (@tenantId, @nome, @usuario, @email, @senhaHash, @perfil, @turno, @ativo, SYSUTCDATETIME())
    `);

  const created = result.recordset[0];

  if (!created) {
    throw new Error("USER_CREATE_FAILED");
  }

  return created as unknown as AdminUsuarioListItem;
}

async function findByIdForManagementMssql(tenantId: number, usuarioId: number): Promise<UsuarioManageItem | null> {
  const pool = await getMssqlPool();
  const result = await pool.request().input("tenantId", tenantId).input("usuarioId", usuarioId).query<{
    id: number;
    perfil: string;
    ativo: boolean;
  }>(`
      SELECT TOP 1 id, perfil, ativo
      FROM portaria.portaria_usuarios
      WHERE tenantId = @tenantId
        AND id = @usuarioId
    `);

  return (result.recordset[0] as unknown as UsuarioManageItem | undefined) ?? null;
}

async function setAtivoByIdMssql(tenantId: number, usuarioId: number, ativo: boolean): Promise<void> {
  const pool = await getMssqlPool();
  await pool
    .request()
    .input("tenantId", tenantId)
    .input("usuarioId", usuarioId)
    .input("ativo", ativo)
    .query(`
      UPDATE portaria.portaria_usuarios
      SET ativo = @ativo
      WHERE tenantId = @tenantId
        AND id = @usuarioId
    `);
}

async function updateSenhaHashMssql(tenantId: number, usuarioId: number, senhaHash: string): Promise<void> {
  const pool = await getMssqlPool();
  await pool
    .request()
    .input("tenantId", tenantId)
    .input("usuarioId", usuarioId)
    .input("senhaHash", senhaHash)
    .query(`
      UPDATE portaria.portaria_usuarios
      SET senhaHash = @senhaHash
      WHERE tenantId = @tenantId
        AND id = @usuarioId
    `);
}

export const usuarioRepository: IUsuarioRepository = {
  async listUsuarios(tenantId: number) {
    if (env.DB_CLIENT === "mssql") {
      return listUsuariosMssql(tenantId);
    }

    return prisma.usuario.findMany({
      where: { tenantId },
      select: adminUsuarioListSelect,
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    });
  },

  async findByUsuario(usuario: string) {
    if (env.DB_CLIENT === "mssql") {
      return findByUsuarioMssql(usuario);
    }

    return prisma.usuario.findFirst({
      where: { usuario },
      select: usuarioMinimalSelect,
    });
  },

  async createOperador(data: Prisma.UsuarioUncheckedCreateInput) {
    if (env.DB_CLIENT === "mssql") {
      return createOperadorMssql(data);
    }

    return prisma.usuario.create({
      data,
      select: adminUsuarioListSelect,
    });
  },

  async findByIdForManagement(tenantId: number, usuarioId: number) {
    if (env.DB_CLIENT === "mssql") {
      return findByIdForManagementMssql(tenantId, usuarioId);
    }

    return prisma.usuario.findFirst({
      where: {
        tenantId,
        id: usuarioId,
      },
      select: usuarioManageSelect,
    });
  },

  async deactivateById(tenantId: number, usuarioId: number) {
    if (env.DB_CLIENT === "mssql") {
      await setAtivoByIdMssql(tenantId, usuarioId, false);
      return;
    }

    await prisma.usuario.updateMany({
      where: {
        tenantId,
        id: usuarioId,
      },
      data: { ativo: false },
    });
  },

  async activateById(tenantId: number, usuarioId: number) {
    if (env.DB_CLIENT === "mssql") {
      await setAtivoByIdMssql(tenantId, usuarioId, true);
      return;
    }

    await prisma.usuario.updateMany({
      where: {
        tenantId,
        id: usuarioId,
      },
      data: { ativo: true },
    });
  },

  async updateSenhaHash(tenantId: number, usuarioId: number, senhaHash: string) {
    if (env.DB_CLIENT === "mssql") {
      await updateSenhaHashMssql(tenantId, usuarioId, senhaHash);
      return;
    }

    await prisma.usuario.updateMany({
      where: {
        tenantId,
        id: usuarioId,
      },
      data: { senhaHash },
    });
  },
};
