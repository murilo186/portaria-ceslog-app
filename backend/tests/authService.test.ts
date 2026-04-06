import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirstMock = vi.fn();
const compareMock = vi.fn();
const signTokenMock = vi.fn();

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
      nome: "Operador",
      usuario: "operador",
      email: "operador@ceslog.local",
      senhaHash: "hash",
      perfil: "OPERADOR",
      turno: "MANHA",
      ativo: true,
    });
    compareMock.mockResolvedValue(true);
    signTokenMock.mockReturnValue("jwt.mock");

    const response = await loginService({
      usuario: "operador",
      senha: "123456",
    });

    expect(signTokenMock).toHaveBeenCalledTimes(1);
    expect(response.token).toBe("jwt.mock");
    expect(response.usuario).toMatchObject({
      id: 10,
      nome: "Operador",
      perfil: "OPERADOR",
    });
  });
});
