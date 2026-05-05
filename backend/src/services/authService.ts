import { env } from "../config/env";
import { authRepository } from "../repositories/authRepository";
import { getMssqlPool } from "../lib/mssql";
import { signToken } from "../lib/jwt";
import { AppError } from "../middlewares/errorMiddleware";
import { createOrReplaceUserSession } from "./sessionService";
import { createAuthService } from "./auth/createAuthService";
import { toUpperWithoutAccents } from "../utils/sanitize";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

const authService = createAuthService({
  repository: authRepository,
  passwordComparer: {
    compare: (plain, hash) => bcrypt.compare(plain, hash),
  },
  sessionIssuer: {
    createOrReplaceUserSession,
  },
  tokenSigner: {
    signToken,
  },
});

type MssqlLoginRow = {
  id: number;
  tenantId: number;
  nome: string;
  usuario: string | null;
  email: string | null;
  senhaHash: string;
  perfil: string;
  turno: string | null;
  ativo: boolean;
  tenant_id: number;
  tenant_slug: string;
  tenant_nome: string;
  tenant_ativo: boolean;
};

function normalizeLoginUsuario(value: string): string {
  return toUpperWithoutAccents(value.trim());
}

async function createOrReplaceUserSessionMssql(usuarioId: number): Promise<string> {
  const sessionId = randomUUID();
  const pool = await getMssqlPool();

  await pool
    .request()
    .input("usuarioId", usuarioId)
    .input("sessionId", sessionId)
    .query(`
      MERGE portaria.portaria_auth_sessions AS target
      USING (SELECT @usuarioId AS usuario_id, @sessionId AS session_id) AS source
      ON target.usuario_id = source.usuario_id
      WHEN MATCHED THEN
        UPDATE SET session_id = source.session_id, atualizado_em = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (usuario_id, session_id, atualizado_em)
        VALUES (source.usuario_id, source.session_id, SYSUTCDATETIME());
    `);

  return sessionId;
}

async function loginServiceMssql(input: { usuario: string; senha: string }) {
  const usuarioInformado = normalizeLoginUsuario(input.usuario);
  const pool = await getMssqlPool();
  const result = await pool.request().input("usuario", usuarioInformado).query<MssqlLoginRow>(`
      SELECT TOP 1
        u.id,
        u.tenantId,
        u.nome,
        u.usuario,
        u.email,
        u.senhaHash,
        u.perfil,
        u.turno,
        u.ativo,
        t.id AS tenant_id,
        t.slug AS tenant_slug,
        t.nome AS tenant_nome,
        t.ativo AS tenant_ativo
      FROM portaria.portaria_usuarios u
      INNER JOIN portaria.portaria_tenants t ON t.id = u.tenantId
      WHERE u.usuario = @usuario;
    `);

  const usuario = result.recordset[0];

  if (!usuario || !usuario.ativo || !usuario.tenant_ativo) {
    throw new AppError("Credenciais invalidas", 401, "INVALID_CREDENTIALS");
  }

  const senhaValida = await bcrypt.compare(input.senha, usuario.senhaHash);

  if (!senhaValida) {
    throw new AppError("Credenciais invalidas", 401, "INVALID_CREDENTIALS");
  }

  const sessionId = await createOrReplaceUserSessionMssql(usuario.id);
  const token = signToken({
    sub: usuario.id,
    tenantId: usuario.tenantId,
    tenantSlug: usuario.tenant_slug,
    tenantNome: usuario.tenant_nome,
    perfil: usuario.perfil as "ADMIN" | "OPERADOR",
    nome: usuario.nome,
    usuario: usuario.usuario,
    email: usuario.email,
    turno: (usuario.turno as "MANHA" | "TARDE" | null) ?? null,
    sessionId,
  });

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      usuario: usuario.usuario,
      email: usuario.email,
      perfil: usuario.perfil as "ADMIN" | "OPERADOR",
      turno: (usuario.turno as "MANHA" | "TARDE" | null) ?? null,
      tenant: {
        id: usuario.tenant_id,
        slug: usuario.tenant_slug,
        nome: usuario.tenant_nome,
      },
    },
  };
}

export async function loginService(input: { usuario: string; senha: string }) {
  if (env.DB_CLIENT === "mssql") {
    return loginServiceMssql(input);
  }

  return authService.loginService(input);
}
