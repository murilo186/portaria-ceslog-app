import type { FormEventHandler } from "react";
import { useMemo, useState } from "react";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import ConfirmModal from "../../../components/ConfirmModal";
import Input from "../../../components/Input";
import ListSkeleton from "../../../components/ListSkeleton";
import SelectField from "../../../components/SelectField";
import type { TurnoUsuario, UsuarioAdminListItem } from "../../../types/usuario";

type NovoUsuarioFormValues = {
  nome: string;
  usuario: string;
  senha: string;
  turno: TurnoUsuario;
};

type StatusFilter = "TODOS" | "ATIVO" | "INATIVO";

const USERS_PAGE_SIZE = 8;

type AdminUsuariosSectionProps = {
  authUserId: number | null;
  isLoadingUsuarios: boolean;
  isCreatingUsuario: boolean;
  isUpdatingUsuarioAtivo: boolean;
  pendingUsuarioId: number | null;
  usuarios: UsuarioAdminListItem[];
  novoUsuarioForm: NovoUsuarioFormValues;
  onChangeNome: (value: string) => void;
  onChangeUsuario: (value: string) => void;
  onChangeSenha: (value: string) => void;
  onChangeTurno: (turno: TurnoUsuario) => void;
  onCreateUsuario: FormEventHandler<HTMLFormElement>;
  onToggleUsuarioAtivo: (usuarioId: number, ativoAtual: boolean) => Promise<void>;
};

type ConfirmState = {
  usuarioId: number;
  ativoAtual: boolean;
  nome: string;
};

function StatusPill({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${
        ativo ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-700"
      }`}
    >
      {ativo ? "ATIVO" : "INATIVO"}
    </span>
  );
}

export default function AdminUsuariosSection({
  authUserId,
  isLoadingUsuarios,
  isCreatingUsuario,
  isUpdatingUsuarioAtivo,
  pendingUsuarioId,
  usuarios,
  novoUsuarioForm,
  onChangeNome,
  onChangeUsuario,
  onChangeSenha,
  onChangeTurno,
  onCreateUsuario,
  onToggleUsuarioAtivo,
}: AdminUsuariosSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODOS");
  const [page, setPage] = useState(1);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const filteredUsuarios = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return usuarios.filter((item) => {
      const matchesStatus =
        statusFilter === "TODOS" || (statusFilter === "ATIVO" ? item.ativo : !item.ativo);

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const normalizedNome = item.nome.toLowerCase();
      const normalizedUsuario = (item.usuario ?? "").toLowerCase();

      return normalizedNome.includes(normalizedSearch) || normalizedUsuario.includes(normalizedSearch);
    });
  }, [searchTerm, statusFilter, usuarios]);

  const totalPages = Math.max(1, Math.ceil(filteredUsuarios.length / USERS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * USERS_PAGE_SIZE;
  const paginatedUsuarios = filteredUsuarios.slice(start, start + USERS_PAGE_SIZE);

  const handleOpenConfirm = (usuarioId: number, ativoAtual: boolean, nome: string) => {
    setConfirmState({ usuarioId, ativoAtual, nome });
  };

  const handleConfirmToggle = async () => {
    if (!confirmState) {
      return;
    }

    await onToggleUsuarioAtivo(confirmState.usuarioId, confirmState.ativoAtual);
    setConfirmState(null);
  };

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="space-y-4 xl:col-span-1">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-text-900">Criar usuário</h2>
            <p className="text-sm text-text-700">Campos obrigatórios: nome, usuário, senha e turno.</p>
          </div>

          <form className="space-y-3" onSubmit={onCreateUsuario}>
            <Input
              id="novo-nome"
              label="Nome"
              value={novoUsuarioForm.nome}
              onChange={(event) => onChangeNome(event.target.value)}
              placeholder="Nome completo"
              required
            />

            <Input
              id="novo-usuario"
              label="Usuário"
              value={novoUsuarioForm.usuario}
              onChange={(event) => onChangeUsuario(event.target.value)}
              placeholder="usuario.exemplo"
              required
            />

            <Input
              id="nova-senha"
              label="Senha"
              type="password"
              value={novoUsuarioForm.senha}
              onChange={(event) => onChangeSenha(event.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />

            <SelectField
              id="novo-turno"
              label="Turno"
              value={novoUsuarioForm.turno}
              onChange={(event) => onChangeTurno(event.target.value as TurnoUsuario)}
            >
              <option value="MANHA">MANHÃ</option>
              <option value="TARDE">TARDE</option>
            </SelectField>

            <Button type="submit" className="w-full" disabled={isCreatingUsuario || isLoadingUsuarios}>
              {isCreatingUsuario ? "Salvando..." : "Criar usuário"}
            </Button>
          </form>
        </Card>

        <Card className="space-y-3 xl:col-span-2">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-text-900">Lista de usuários</h2>
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                id="usuarios-busca"
                label="Buscar por nome ou usuário"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Ex.: Joao ou operador.manha"
              />
              <SelectField
                id="usuarios-status"
                label="Status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter);
                  setPage(1);
                }}
              >
                <option value="TODOS">Todos</option>
                <option value="ATIVO">Ativos</option>
                <option value="INATIVO">Inativos</option>
              </SelectField>
            </div>
          </div>

          {isLoadingUsuarios ? (
            <ListSkeleton rows={5} />
          ) : filteredUsuarios.length === 0 ? (
            <p className="text-sm text-text-700">Nenhum usuário encontrado para o filtro aplicado.</p>
          ) : (
            <>
              <div className="space-y-2">
                {paginatedUsuarios.map((item) => {
                  const isCurrentUser = authUserId === item.id;
                  const isOperador = item.perfil === "OPERADOR";
                  const canToggle = isOperador && !isCurrentUser;
                  const isRowPending = pendingUsuarioId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 rounded-md border border-surface-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-text-900">{item.nome}</p>
                        <p className="text-xs text-text-700">Usuário: {item.usuario ?? "-"}</p>
                        <p className="text-xs text-text-700">Turno: {item.turno ?? "-"}</p>
                        <p className="text-xs text-text-700">Perfil: {item.perfil}</p>
                        <StatusPill ativo={item.ativo} />
                      </div>

                  {item.perfil === "ADMIN" ? null : (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={() => handleOpenConfirm(item.id, item.ativo, item.nome)}
                      disabled={!canToggle || isCreatingUsuario || (isUpdatingUsuarioAtivo && !isRowPending)}
                    >
                          {isRowPending && isUpdatingUsuarioAtivo
                            ? "Processando..."
                            : item.ativo
                              ? "Inativar"
                              : "Ativar"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <p className="text-xs text-text-700">
                  Página {safePage} de {totalPages} · {filteredUsuarios.length} usuário(s)
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="px-3 py-2 text-xs"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={safePage <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="px-3 py-2 text-xs"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={safePage >= totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmState)}
        title={confirmState?.ativoAtual ? "Inativar usuário" : "Ativar usuário"}
        description={
          confirmState
            ? confirmState.ativoAtual
              ? `Confirma inativar ${confirmState.nome}? Ele não conseguirá mais logar.`
              : `Confirma ativar ${confirmState.nome} novamente?`
            : ""
        }
        confirmLabel={confirmState?.ativoAtual ? "Inativar" : "Ativar"}
        isConfirming={isUpdatingUsuarioAtivo}
        onCancel={() => setConfirmState(null)}
        onConfirm={handleConfirmToggle}
      />
    </>
  );
}
