import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();
const compareMock = vi.fn();
const signTokenMock = vi.fn();

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    usuario: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
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
    findUniqueMock.mockResolvedValue(null);

    await expect(loginService({ email: "x@x.com", senha: "123" })).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("retorna token e usuário quando credenciais são válidas", async () => {
    findUniqueMock.mockResolvedValue({
      id: 10,
      nome: "Operador",
      email: "operador@ceslog.local",
      senhaHash: "hash",
      perfil: "OPERADOR",
      turno: "MANHA",
      ativo: true,
    });
    compareMock.mockResolvedValue(true);
    signTokenMock.mockReturnValue("jwt.mock");

    const response = await loginService({
      email: "operador@ceslog.local",
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
