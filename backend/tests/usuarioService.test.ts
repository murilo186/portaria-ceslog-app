import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();
const findFirstMock = vi.fn();
const createMock = vi.fn();
const findUserForManagementMock = vi.fn();
const updateManyMock = vi.fn();
const hashMock = vi.fn();

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    usuario: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      create: (...args: unknown[]) => createMock(...args),
      updateMany: (...args: unknown[]) => updateManyMock(...args),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: (...args: unknown[]) => hashMock(...args),
  },
}));

import { createUsuarioService, deleteUsuarioService, listUsuariosService } from "../src/services/usuarioService";

describe("usuarioService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // findFirst e usado para buscar por usuario e por id+tenant.
    findFirstMock.mockImplementation((args?: { where?: Record<string, unknown> }) => {
      if (args?.where && "id" in args.where) {
        return findUserForManagementMock(args);
      }

      return null;
    });
  });

  it("lista usuarios", async () => {
    findManyMock.mockResolvedValue([{ id: 1, nome: "Operador", usuario: "operador", ativo: true }]);

    const result = await listUsuariosService(1);

    expect(findManyMock).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
  });

  it("bloqueia criacao com usuario invalido", async () => {
    await expect(
      createUsuarioService(
        {
          nome: "Operador",
          usuario: "A",
          senha: "123456",
          turno: "MANHA",
        },
        1,
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_USERNAME",
    });
  });

  it("cria usuario operador", async () => {
    hashMock.mockResolvedValue("hash.mock");
    createMock.mockResolvedValue({
      id: 10,
      nome: "Operador 1",
      usuario: "operador.1",
      email: "operador.1@usuario.local",
      perfil: "OPERADOR",
      turno: null,
      ativo: true,
      criadoEm: new Date("2026-04-06T12:00:00.000Z"),
    });

    const result = await createUsuarioService(
      {
        nome: "Operador 1",
        usuario: "Operador.1",
        senha: "123456",
        turno: "TARDE",
      },
      2,
    );

    expect(hashMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock.mock.calls[0][0].data.tenantId).toBe(2);
    expect(result.usuario).toBe("operador.1");
  });

  it("sanitiza nome ao criar usuario", async () => {
    hashMock.mockResolvedValue("hash.mock");
    createMock.mockResolvedValue({
      id: 12,
      nome: "Operador Script",
      usuario: "operador.script",
      email: "operador.script@usuario.local",
      perfil: "OPERADOR",
      turno: "MANHA",
      ativo: true,
      criadoEm: new Date("2026-04-06T12:00:00.000Z"),
    });

    await createUsuarioService(
      {
        nome: " <script>alert(1)</script>Operador Script ",
        usuario: "operador.script",
        senha: "123456",
        turno: "MANHA",
      },
      1,
    );

    const [callArg] = createMock.mock.calls[0] as [{ data: Record<string, unknown> }];
    expect(callArg.data.nome).toBe("alert(1) Operador Script");
  });

  it("bloqueia auto exclusao", async () => {
    findUserForManagementMock.mockResolvedValue({
      id: 7,
      perfil: "ADMIN",
      ativo: true,
    });

    await expect(deleteUsuarioService(7, 7, 1)).rejects.toMatchObject({
      statusCode: 409,
      code: "SELF_DELETE_BLOCKED",
    });
  });

  it("desativa operador quando exclusao permitida", async () => {
    findUserForManagementMock.mockResolvedValue({
      id: 11,
      perfil: "OPERADOR",
      ativo: true,
    });
    updateManyMock.mockResolvedValue({ count: 1 });

    const result = await deleteUsuarioService(11, 1, 1);

    expect(updateManyMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true });
  });
});
