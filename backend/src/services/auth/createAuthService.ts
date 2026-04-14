import { AppError } from "../../middlewares/errorMiddleware";
import type { IAuthRepository } from "../../repositories/authRepository";
import type { LoginInput } from "../../types/auth";

type PasswordComparer = {
  compare(plain: string, hash: string): Promise<boolean>;
};

type SessionIssuer = {
  createOrReplaceUserSession(usuarioId: number): Promise<string>;
};

type TokenSigner = {
  signToken(payload: {
    sub: number;
    tenantId: number;
    tenantSlug: string;
    tenantNome: string;
    perfil: "ADMIN" | "OPERADOR";
    nome: string;
    usuario: string | null;
    email: string | null;
    turno: "MANHA" | "TARDE" | null;
    sessionId: string;
  }): string;
};

export type AuthServiceDeps = {
  repository: IAuthRepository;
  passwordComparer: PasswordComparer;
  sessionIssuer: SessionIssuer;
  tokenSigner: TokenSigner;
};

function normalizeUsuario(value: string): string {
  return value.trim().toLowerCase();
}

export function createAuthService({ repository, passwordComparer, sessionIssuer, tokenSigner }: AuthServiceDeps) {
  async function loginService(input: LoginInput) {
    const usuarioInformado = normalizeUsuario(input.usuario);
    const usuario = await repository.findLoginUserByUsuario(usuarioInformado);

    if (!usuario || !usuario.ativo || !usuario.tenant.ativo) {
      throw new AppError("Credenciais invalidas", 401, "INVALID_CREDENTIALS");
    }

    const senhaValida = await passwordComparer.compare(input.senha, usuario.senhaHash);

    if (!senhaValida) {
      throw new AppError("Credenciais invalidas", 401, "INVALID_CREDENTIALS");
    }

    const sessionId = await sessionIssuer.createOrReplaceUserSession(usuario.id);

    const token = tokenSigner.signToken({
      sub: usuario.id,
      tenantId: usuario.tenantId,
      tenantSlug: usuario.tenant.slug,
      tenantNome: usuario.tenant.nome,
      perfil: usuario.perfil,
      nome: usuario.nome,
      usuario: usuario.usuario,
      email: usuario.email,
      turno: usuario.turno,
      sessionId,
    });

    return {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        usuario: usuario.usuario,
        email: usuario.email,
        perfil: usuario.perfil,
        turno: usuario.turno,
        tenant: {
          id: usuario.tenant.id,
          slug: usuario.tenant.slug,
          nome: usuario.tenant.nome,
        },
      },
    };
  }

  return {
    loginService,
  };
}
