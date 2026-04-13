import type { FormEventHandler } from "react";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
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

type AdminUsuariosSectionProps = {
  authUserId: number | null;
  isLoadingUsuarios: boolean;
  isSubmittingUsuario: boolean;
  usuarios: UsuarioAdminListItem[];
  novoUsuarioForm: NovoUsuarioFormValues;
  onChangeNome: (value: string) => void;
  onChangeUsuario: (value: string) => void;
  onChangeSenha: (value: string) => void;
  onChangeTurno: (turno: TurnoUsuario) => void;
  onCreateUsuario: FormEventHandler<HTMLFormElement>;
  onToggleUsuarioAtivo: (usuarioId: number, ativoAtual: boolean) => Promise<void>;
};

export default function AdminUsuariosSection({
  authUserId,
  isLoadingUsuarios,
  isSubmittingUsuario,
  usuarios,
  novoUsuarioForm,
  onChangeNome,
  onChangeUsuario,
  onChangeSenha,
  onChangeTurno,
  onCreateUsuario,
  onToggleUsuarioAtivo,
}: AdminUsuariosSectionProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="space-y-4 xl:col-span-1">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-text-900">Criar usuÃ¡rio</h2>
          <p className="text-sm text-text-700">Campos obrigatÃ³rios: nome, usuÃ¡rio, senha e turno.</p>
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
            label="UsuÃ¡rio"
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
            placeholder="MÃ­nimo 6 caracteres"
            required
          />

          <SelectField
            id="novo-turno"
            label="Turno"
            value={novoUsuarioForm.turno}
            onChange={(event) => onChangeTurno(event.target.value as TurnoUsuario)}
          >
              <option value="MANHA">MANHÃƒ</option>
              <option value="TARDE">TARDE</option>
          </SelectField>

          <Button type="submit" className="w-full" disabled={isSubmittingUsuario || isLoadingUsuarios}>
            {isSubmittingUsuario ? "Salvando..." : "Criar usuÃ¡rio"}
          </Button>
        </form>
      </Card>

      <Card className="space-y-3 xl:col-span-2">
        <h2 className="text-lg font-semibold text-text-900">Lista de usuÃ¡rios</h2>

        {isLoadingUsuarios ? (
          <ListSkeleton rows={5} />
        ) : usuarios.length === 0 ? (
          <p className="text-sm text-text-700">Nenhum usuÃ¡rio encontrado.</p>
        ) : (
          <div className="space-y-2">
            {usuarios.map((item) => {
              const isCurrentUser = authUserId === item.id;
              const isOperador = item.perfil === "OPERADOR";
              const canToggle = isOperador && !isCurrentUser;

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-md border border-surface-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-text-900">{item.nome}</p>
                    <p className="text-xs text-text-700">UsuÃ¡rio: {item.usuario ?? "-"}</p>
                    <p className="text-xs text-text-700">Turno: {item.turno ?? "-"}</p>
                    <p className="text-xs text-text-700">Perfil: {item.perfil}</p>
                    <p className="text-xs text-text-700">Status: {item.ativo ? "ATIVO" : "INATIVO"}</p>
                  </div>

                  {item.perfil === "ADMIN" ? null : (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={() => void onToggleUsuarioAtivo(item.id, item.ativo)}
                      disabled={!canToggle || isSubmittingUsuario}
                    >
                      {item.ativo ? "Inativar" : "Ativar"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
