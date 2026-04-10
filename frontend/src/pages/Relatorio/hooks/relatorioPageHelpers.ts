import type { RelatorioItem, RelatorioItemEditableFields } from "../../../types/relatorio";
import type { Usuario } from "../../../types/usuario";

export const initialFormValues: RelatorioItemEditableFields = {
  perfilPessoa: "VISITANTE",
  empresa: "",
  placaVeiculo: "",
  nome: "",
  horaEntrada: "",
  horaSaida: "",
  observacoes: "",
};

export function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function getAutorLabel(item: RelatorioItem, fallbackUser: Usuario | null): string {
  if (item.usuario?.nome) {
    return item.usuario.nome;
  }

  if (fallbackUser) {
    return fallbackUser.nome;
  }

  return "-";
}

export function mapItemToFormValues(item: RelatorioItem): RelatorioItemEditableFields {
  return {
    perfilPessoa: item.perfilPessoa,
    empresa: item.empresa,
    placaVeiculo: item.placaVeiculo,
    nome: item.nome,
    horaEntrada: item.horaEntrada ?? "",
    horaSaida: item.horaSaida ?? "",
    observacoes: item.observacoes ?? "",
  };
}

export function buildQuickSetSaidaPayload(item: RelatorioItem): RelatorioItemEditableFields {
  const currentTime = getCurrentTime();

  return {
    perfilPessoa: item.perfilPessoa,
    empresa: item.empresa,
    placaVeiculo: item.placaVeiculo,
    nome: item.nome,
    horaEntrada: item.horaEntrada ?? currentTime,
    horaSaida: currentTime,
    observacoes: item.observacoes ?? "",
  };
}
