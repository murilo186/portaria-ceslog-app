import type { PerfilPessoa, RelatorioItemEditableFields } from "../types/relatorio";

const PLACA_REGEX = /^[A-Z]{3}-?\d[A-Z0-9]\d{2}$/;
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const PERFIL_PESSOA_VALUES: PerfilPessoa[] = [
  "VISITANTE",
  "FORNECEDOR",
  "PRESTADOR",
  "PARCEIRO",
  "COLABORADOR",
  "AGREGADO",
];

function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function keepOnlyAlphaNumeric(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "");
}

export function formatPlacaInput(value: string): string {
  const raw = keepOnlyAlphaNumeric(value.toUpperCase()).slice(0, 7);

  if (raw.length <= 3) {
    return raw;
  }

  return `${raw.slice(0, 3)}-${raw.slice(3)}`;
}

export function normalizeRelatorioPayload(input: RelatorioItemEditableFields): RelatorioItemEditableFields {
  return {
    perfilPessoa: input.perfilPessoa,
    empresa: collapseSpaces(input.empresa),
    placaVeiculo: keepOnlyAlphaNumeric(input.placaVeiculo.toUpperCase()),
    nome: collapseSpaces(input.nome),
    horaEntrada: input.horaEntrada?.trim() ?? "",
    horaSaida: input.horaSaida?.trim() ?? "",
    observacoes: input.observacoes ? collapseSpaces(input.observacoes) : "",
  };
}

export function validateRelatorioPayload(input: RelatorioItemEditableFields): string[] {
  const errors: string[] = [];

  if (!PERFIL_PESSOA_VALUES.includes(input.perfilPessoa)) {
    errors.push("Perfil de pessoa inválido.");
  }

  if (!input.empresa.trim()) {
    errors.push("Empresa é obrigatória.");
  }

  if (!input.nome.trim()) {
    errors.push("Nome é obrigatório.");
  }

  const normalizedPlaca = input.placaVeiculo.trim().toUpperCase();
  if (!normalizedPlaca) {
    errors.push("Placa é obrigatória.");
  } else if (!PLACA_REGEX.test(normalizedPlaca)) {
    errors.push("Placa inválida. Use ABC1D23 ou ABC-1234.");
  }

  if (input.horaEntrada && !HORA_REGEX.test(input.horaEntrada)) {
    errors.push("Hora de entrada inválida. Use HH:mm.");
  }

  if (input.horaSaida && !HORA_REGEX.test(input.horaSaida)) {
    errors.push("Hora de saída inválida. Use HH:mm.");
  }

  return errors;
}

