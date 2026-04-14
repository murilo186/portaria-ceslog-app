import { AppError } from "../../middlewares/errorMiddleware";
import type { IUsuarioRepository } from "../../repositories/usuarioRepository";
import type { CreateUsuarioInput } from "../../types/usuario";
import { sanitizeText } from "../../utils/sanitize";

const usuarioRegex = /^[a-z0-9._-]{3,30}$/;

type PasswordHasher = {
  hash(value: string, saltRounds: number): Promise<string>;
};

type UsuarioServiceDeps = {
  repository: IUsuarioRepository;
  passwordHasher: PasswordHasher;
};

function normalizeUsuario(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeNome(value: string): string {
  return sanitizeText(value);
}

function buildInternalEmail(usuario: string): string {
  return `${usuario}@usuario.local`;
}

export function createUsuarioService({ repository, passwordHasher }: UsuarioServiceDeps) {
  async function listUsuariosService(tenantId: number) {
    return repository.listUsuarios(tenantId);
  }

  async function createUsuarioService(input: CreateUsuarioInput, tenantId: number) {
    const nome = normalizeNome(input.nome);
    const usuario = normalizeUsuario(input.usuario);

    if (!usuarioRegex.test(usuario)) {
      throw new AppError(
        "Usuario invalido. Use 3 a 30 caracteres (a-z, 0-9, ponto, underline ou hifen).",
        400,
        "INVALID_USERNAME",
      );
    }

    const existente = await repository.findByUsuario(usuario);

    if (existente) {
      throw new AppError("Usuario ja cadastrado.", 409, "USERNAME_ALREADY_EXISTS");
    }

    const senhaHash = await passwordHasher.hash(input.senha, 10);

    return repository.createOperador({
      tenantId,
      nome,
      usuario,
      email: buildInternalEmail(usuario),
      senhaHash,
      perfil: "OPERADOR",
      turno: input.turno,
      ativo: true,
    });
  }

  async function deleteUsuarioService(usuarioId: number, currentAdminId: number, tenantId: number) {
    return setUsuarioAtivoService(usuarioId, currentAdminId, tenantId, false);
  }

  async function setUsuarioAtivoService(usuarioId: number, currentAdminId: number, tenantId: number, ativo: boolean) {
    const usuario = await repository.findByIdForManagement(tenantId, usuarioId);

    if (!usuario) {
      throw new AppError("Usuario nao encontrado.", 404, "USER_NOT_FOUND");
    }

    if (usuario.id === currentAdminId) {
      throw new AppError("Nao e permitido excluir o proprio usuario logado.", 409, "SELF_DELETE_BLOCKED");
    }

    if (usuario.perfil === "ADMIN") {
      throw new AppError("Nao e permitido excluir conta de administrador.", 409, "ADMIN_DELETE_BLOCKED");
    }

    if (usuario.ativo === ativo) {
      return { ok: true } as const;
    }

    if (ativo) {
      await repository.activateById(tenantId, usuarioId);
    } else {
      await repository.deactivateById(tenantId, usuarioId);
    }

    return { ok: true } as const;
  }

  async function updateUsuarioSenhaService(usuarioId: number, currentAdminId: number, tenantId: number, novaSenha: string) {
    const usuario = await repository.findByIdForManagement(tenantId, usuarioId);

    if (!usuario) {
      throw new AppError("Usuario nao encontrado.", 404, "USER_NOT_FOUND");
    }

    if (usuario.id === currentAdminId) {
      throw new AppError("Use a alteracao de senha da propria conta.", 409, "SELF_PASSWORD_CHANGE_BLOCKED");
    }

    if (usuario.perfil === "ADMIN") {
      throw new AppError("Troca de senha permitida apenas para operadores.", 409, "ADMIN_PASSWORD_CHANGE_BLOCKED");
    }

    const senhaHash = await passwordHasher.hash(novaSenha, 10);
    await repository.updateSenhaHash(tenantId, usuarioId, senhaHash);

    return { ok: true } as const;
  }

  return {
    listUsuariosService,
    createUsuarioService,
    deleteUsuarioService,
    setUsuarioAtivoService,
    updateUsuarioSenhaService,
  };
}
