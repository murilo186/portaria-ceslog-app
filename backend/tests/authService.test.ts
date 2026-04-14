import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirstMock = vi.fn();
const compareMock = vi.fn();
const signTokenMock = vi.fn();
const createOrReplaceUserSessionMock = vi.fn();

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    usuario: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: (...args: unknown[]) => compareMock(...args),
  },
}));

vi.mock("../src/lib/jwt", () => ({
  signToken: (...args: unknown[]) => signTokenMock(...args),
}));

vi.mock("../src/services/sessionService", () => ({
  createOrReplaceUserSession: (...args: unknown[]) => createOrReplaceUserSessionMock(...args),
}));

import { loginService } from "../src/services/authService";

describe("loginService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna erro 401 para credenciais inválidas", async () => {
    findFirstMock.mockResolvedValue(null);

    await expect(loginService({ usuario: "x", senha: "123" })).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("retorna token e usuário quando credenciais são válidas", async () => {
    findFirstMock.mockResolvedValue({
      id: 10,
      tenantId: 1,
      nome: "Operador",
      usuario: "operador",
      email: "operador@ceslog.local",
      senhaHash: "hash",
      perfil: "OPERADOR",
      turno: "MANHA",
      ativo: true,
      tenant: {
        id: 1,
        slug: "ceslog",
        nome: "CESLOG",
        ativo: true,
      },
    });
    compareMock.mockResolvedValue(true);
    createOrReplaceUserSessionMock.mockResolvedValue("session.mock");
    signTokenMock.mockReturnValue("jwt.mock");

    const response = await loginService({
      usuario: "operador",
      senha: "123456",
    });

    expect(createOrReplaceUserSessionMock).toHaveBeenCalledWith(10);
    expect(signTokenMock).toHaveBeenCalledTimes(1);
    expect(signTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session.mock",
      }),
    );
    expect(response.token).toBe("jwt.mock");
    expect(response.usuario).toMatchObject({
      id: 10,
      nome: "Operador",
      perfil: "OPERADOR",
      tenant: {
        id: 1,
        slug: "ceslog",
      },
    });
  });
});
