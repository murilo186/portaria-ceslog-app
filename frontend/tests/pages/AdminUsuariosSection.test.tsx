import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminUsuariosSection from "../../src/pages/Admin/components/AdminUsuariosSection";
import type { UsuarioAdminListItem } from "../../src/types/usuario";

function createUsuario(id: number, nome: string, perfil: "ADMIN" | "OPERADOR", ativo = true): UsuarioAdminListItem {
  return {
    id,
    nome,
    usuario: nome.toLowerCase().replace(/\s+/g, "."),
    email: `${id}@usuario.local`,
    perfil,
    turno: perfil === "OPERADOR" ? "MANHA" : null,
    ativo,
    criadoEm: "2026-04-30T10:00:00.000Z",
  };
}

const baseForm = {
  nome: "",
  usuario: "",
  senha: "",
  turno: "MANHA" as const,
};

describe("AdminUsuariosSection", () => {
  it("aplica busca e pagina usuários", async () => {
    const usuarios = Array.from({ length: 9 }, (_, i) =>
      createUsuario(i + 1, `Operador ${i + 1}`, "OPERADOR", true),
    );

    render(
      <AdminUsuariosSection
        authUserId={999}
        isLoadingUsuarios={false}
        isCreatingUsuario={false}
        isUpdatingUsuarioAtivo={false}
        pendingUsuarioId={null}
        usuarios={usuarios}
        novoUsuarioForm={baseForm}
        onChangeNome={vi.fn()}
        onChangeUsuario={vi.fn()}
        onChangeSenha={vi.fn()}
        onChangeTurno={vi.fn()}
        onCreateUsuario={vi.fn((event) => event.preventDefault())}
        onToggleUsuarioAtivo={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByText("Página 1 de 2 - 9 usuário(s)")).toBeInTheDocument();
    expect(screen.getByText("Operador 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(screen.getByText("Página 2 de 2 - 9 usuário(s)")).toBeInTheDocument();
    expect(screen.getByText("Operador 9")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Buscar por nome ou usuário"), {
      target: { value: "Operador 9" },
    });

    expect(screen.getByText("Página 1 de 1 - 1 usuário(s)")).toBeInTheDocument();
    expect(screen.getByText("Operador 9")).toBeInTheDocument();
  });

  it("respeita permissão visual de ativar/inativar", () => {
    const usuarios = [
      createUsuario(1, "Admin Root", "ADMIN", true),
      createUsuario(2, "Operador Atual", "OPERADOR", true),
      createUsuario(3, "Operador Alvo", "OPERADOR", true),
    ];

    render(
      <AdminUsuariosSection
        authUserId={2}
        isLoadingUsuarios={false}
        isCreatingUsuario={false}
        isUpdatingUsuarioAtivo={false}
        pendingUsuarioId={null}
        usuarios={usuarios}
        novoUsuarioForm={baseForm}
        onChangeNome={vi.fn()}
        onChangeUsuario={vi.fn()}
        onChangeSenha={vi.fn()}
        onChangeTurno={vi.fn()}
        onCreateUsuario={vi.fn((event) => event.preventDefault())}
        onToggleUsuarioAtivo={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.queryByRole("button", { name: "Inativar usuário" })).not.toBeInTheDocument();

    const currentUserRow = screen.getByText("Operador Atual").closest("div[class*='rounded-md']");
    const targetUserRow = screen.getByText("Operador Alvo").closest("div[class*='rounded-md']");

    expect(currentUserRow).not.toBeNull();
    expect(targetUserRow).not.toBeNull();

    const currentUserButton = currentUserRow?.querySelector("button");
    const targetUserButton = targetUserRow?.querySelector("button");

    expect(currentUserButton?.textContent).toContain("Inativar");
    expect(targetUserButton?.textContent).toContain("Inativar");
    expect(currentUserButton).toBeDisabled();
    expect(targetUserButton).toBeEnabled();
  });
});
