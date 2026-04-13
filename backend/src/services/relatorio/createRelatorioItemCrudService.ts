import { AppError } from "../../middlewares/errorMiddleware";
import type { AuthenticatedUser } from "../../types/auth";
import type { RelatorioItemEditableInput } from "../../types/relatorio";
import type { RelatorioServiceApi, RelatorioServiceContext } from "./types";

export type RelatorioItemCrudServiceApi = Pick<
  RelatorioServiceApi,
  "createRelatorioItemService" | "updateRelatorioItemService" | "deleteRelatorioItemService"
>;

function toNormalizedItemPayload(payload: RelatorioItemEditableInput, sanitize: RelatorioServiceContext["runtime"]["sanitize"]) {
  return {
    perfilPessoa: payload.perfilPessoa,
    empresa: sanitize.sanitizeText(payload.empresa),
    placaVeiculo: payload.placaVeiculo.trim().toUpperCase(),
    nome: sanitize.sanitizeText(payload.nome),
    horaEntrada: sanitize.sanitizeNullableText(payload.horaEntrada),
    horaSaida: sanitize.sanitizeNullableText(payload.horaSaida),
    observacoes: sanitize.sanitizeNullableText(payload.observacoes),
  };
}

export function createRelatorioItemCrudService({ repository, runtime }: RelatorioServiceContext): RelatorioItemCrudServiceApi {
  async function getManagedRelatorioItem(relatorioId: number, itemId: number) {
    const item = await repository.findManagedItem(itemId);

    if (!item || item.relatorioId !== relatorioId) {
      throw new AppError("Item do relatorio nao encontrado", 404, "ITEM_NOT_FOUND");
    }

    return item;
  }

  async function createRelatorioItemService(
    relatorioId: number,
    payload: RelatorioItemEditableInput,
    user: AuthenticatedUser,
  ) {
    const relatorio = await repository.findReportStatusById(relatorioId);

    if (!relatorio) {
      throw new AppError("Relatorio nao encontrado", 404, "REPORT_NOT_FOUND");
    }

    if (relatorio.status === "FECHADO") {
      throw new AppError("Relatorio fechado. Nao e possivel adicionar itens.", 409, "REPORT_CLOSED");
    }

    const created = await repository.createRelatorioItem({
      relatorioId: relatorio.id,
      usuarioId: user.id,
      ...toNormalizedItemPayload(payload, runtime.sanitize),
      turno: user.turno,
    });

    runtime.cache.invalidateRelatorioReadCaches(relatorio.id);

    return {
      ...created,
      usuario: {
        id: user.id,
        nome: user.nome,
        usuario: user.usuario,
        email: user.email,
        perfil: user.perfil,
        turno: user.turno,
      },
    };
  }

  async function updateRelatorioItemService(
    relatorioId: number,
    itemId: number,
    payload: RelatorioItemEditableInput,
    user: AuthenticatedUser,
  ) {
    const item = await getManagedRelatorioItem(relatorioId, itemId);
    runtime.policies.assertCanManageItem(user, item.usuarioId, item.relatorio.status);

    const updated = await repository.updateRelatorioItem(item.id, {
      ...toNormalizedItemPayload(payload, runtime.sanitize),
    });

    runtime.cache.invalidateRelatorioReadCaches(item.relatorioId);

    return {
      ...updated,
      usuario: item.usuario,
    };
  }

  async function deleteRelatorioItemService(relatorioId: number, itemId: number, user: AuthenticatedUser) {
    const item = await getManagedRelatorioItem(relatorioId, itemId);
    runtime.policies.assertCanManageItem(user, item.usuarioId, item.relatorio.status);

    await repository.deleteRelatorioItemById(item.id);
    runtime.cache.invalidateRelatorioReadCaches(item.relatorioId);

    return { ok: true } as const;
  }

  return {
    createRelatorioItemService,
    updateRelatorioItemService,
    deleteRelatorioItemService,
  };
}
