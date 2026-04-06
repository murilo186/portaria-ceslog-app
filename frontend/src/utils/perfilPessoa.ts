import type { PerfilPessoa } from "../types/relatorio";

export const PERFIL_PESSOA_OPTIONS: Array<{ value: PerfilPessoa; label: string }> = [
  { value: "VISITANTE", label: "Visitante" },
  { value: "FORNECEDOR", label: "Fornecedor" },
  { value: "PRESTADOR", label: "Prestador" },
  { value: "PARCEIRO", label: "Parceiro" },
  { value: "COLABORADOR", label: "Colaborador" },
  { value: "AGREGADO", label: "Agregado" },
];

export function perfilPessoaLabel(value: PerfilPessoa): string {
  const matched = PERFIL_PESSOA_OPTIONS.find((option) => option.value === value);
  return matched ? matched.label : value;
}
