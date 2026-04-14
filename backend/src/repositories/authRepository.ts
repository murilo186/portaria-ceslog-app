import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

const authLoginUserSelect = {
  id: true,
  nome: true,
  usuario: true,
  email: true,
  senhaHash: true,
  perfil: true,
  turno: true,
  ativo: true,
  tenantId: true,
  tenant: {
    select: {
      id: true,
      slug: true,
      nome: true,
      ativo: true,
    },
  },
} as const;

export type AuthLoginUser = Prisma.UsuarioGetPayload<{
  select: typeof authLoginUserSelect;
}>;

export interface IAuthRepository {
  findLoginUserByUsuario(usuario: string): Promise<AuthLoginUser | null>;
}

export const authRepository: IAuthRepository = {
  async findLoginUserByUsuario(usuario: string) {
    return prisma.usuario.findFirst({
      where: { usuario },
      select: authLoginUserSelect,
    });
  },
};
